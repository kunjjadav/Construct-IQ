from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from .models import ChangeOrder
from .serializers import ChangeOrderSerializer


@extend_schema(tags=["Change Orders"])
class ChangeOrderViewSet(viewsets.ModelViewSet):
    serializer_class = ChangeOrderSerializer

    def get_permissions(self):
        if self.action in ["approve", "reject"]:
            return [permissions.IsAuthenticated()]
        if self.action == "submit":
            return [permissions.IsAuthenticated()]
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ChangeOrder.objects.none()

        qs = ChangeOrder.objects.select_related(
            "project", "created_by", "approved_by"
        ).order_by("-created_at")

        if user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            user_project_ids = ProjectMember.objects.filter(user=user).values_list(
                "project_id", flat=True
            )
            qs = qs.filter(project_id__in=user_project_ids)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def perform_create(self, serializer):
        if self.request.user.role == "CLIENT":
            raise PermissionDenied(
                "Clients review Change Orders — they do not create them."
            )

        project = serializer.validated_data.get("project")

        if self.request.user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            if not ProjectMember.objects.filter(
                project=project, user=self.request.user
            ).exists():
                raise PermissionDenied(
                    "You do not have permission to create a Change Order for this project."
                )

        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        change_order = self.get_object()

        if change_order.status in ["APPROVED", "REJECTED"]:
            raise ValidationError(
                {"detail": f"Cannot edit a {change_order.status.lower()} Change Order."}
            )

        if change_order.status == "PENDING":
            raise ValidationError(
                {
                    "detail": "Cannot edit a Change Order that is already submitted for client review."
                }
            )

        if (
            change_order.created_by != self.request.user
            and self.request.user.role not in ("AGENT", "ADMIN")
        ):
            raise PermissionDenied(
                "Only the creator or an Agent/Admin can edit this Change Order."
            )

        if "project" in self.request.data:
            try:
                new_project_id = int(self.request.data["project"])
            except (ValueError, TypeError):
                raise ValidationError({"project": ["Invalid project ID."]})
            if new_project_id != change_order.project_id:
                raise ValidationError(
                    {
                        "project": [
                            "You cannot reassign a Change Order to another project."
                        ]
                    }
                )

        serializer.save()

    def perform_destroy(self, instance):
        if instance.status not in ("DRAFT", "PENDING"):
            raise PermissionDenied(
                f"Cannot delete a {instance.status.lower()} Change Order."
            )

        if instance.created_by != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            raise PermissionDenied(
                "Only the creator or an Agent/Admin can delete this Change Order."
            )

        instance.delete()

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        change_order = self.get_object()

        if change_order.created_by != request.user and request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            return Response(
                {
                    "detail": "Only the creator or an Agent/Admin can submit this Change Order."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if change_order.status != "DRAFT":
            return Response(
                {
                    "detail": f"Cannot submit a Change Order that is already {change_order.status.lower()}."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not change_order.title.strip() or not change_order.description.strip():
            return Response(
                {"detail": "Title and description are required before submitting."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        change_order.status = "PENDING"
        change_order.save(update_fields=["status", "updated_at"])

        serializer = self.get_serializer(change_order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        from django.db import transaction
        from django.http import Http404

        with transaction.atomic():
            try:
                change_order = self.get_object()
            except ChangeOrder.DoesNotExist:
                raise Http404

            if request.user.role != "CLIENT":
                return Response(
                    {"detail": "Only a Client can authorize a Change Order."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if change_order.status in ("APPROVED", "REJECTED"):
                return Response(
                    {
                        "detail": f"This Change Order is already {change_order.status.lower()}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = request.data.get("approval_token")
            if not token or str(change_order.approval_token) != token:
                return Response(
                    {"detail": "Invalid or missing approval token."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            change_order.status = "APPROVED"
            change_order.approved_by = request.user
            change_order.approved_at = timezone.now()

            import hashlib

            signature_material = f"{change_order.id}-{request.user.id}-{change_order.approved_at.timestamp()}"
            change_order.signature_hash = hashlib.sha256(
                signature_material.encode()
            ).hexdigest()

            change_order.save()

        from .tasks import generate_co_pdf

        generate_co_pdf.delay(change_order.id)

        serializer = self.get_serializer(change_order)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        from django.db import transaction

        with transaction.atomic():
            change_order = self.get_object()
            change_order = ChangeOrder.objects.select_for_update().get(
                pk=change_order.pk
            )

            if request.user.role not in ("CLIENT", "ADMIN"):
                return Response(
                    {"detail": "Only a Client or Admin can reject Change Orders."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if change_order.status in ("APPROVED", "REJECTED"):
                return Response(
                    {
                        "detail": f"This Change Order is already {change_order.status.lower()}."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = request.data.get("approval_token")
            if not token or str(change_order.approval_token) != token:
                return Response(
                    {"detail": "Invalid or missing approval token."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            change_order.status = "REJECTED"
            change_order.approved_by = request.user
            change_order.approved_at = timezone.now()
            change_order.save()

        serializer = self.get_serializer(change_order)
        return Response(serializer.data, status=status.HTTP_200_OK)
