from rest_framework import viewsets, permissions, status as http_status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.utils import timezone

from .models import RFI
from .serializers import RFISerializer


@extend_schema(tags=["RFIs"])
class RFIViewSet(viewsets.ModelViewSet):
    serializer_class = RFISerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return RFI.objects.none()

        qs = RFI.objects.select_related(
            "project", "submitted_by", "assigned_to"
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
        if self.request.user.role not in ("SITE_OFFICER", "CLIENT", "ADMIN"):
            raise PermissionDenied(
                "Only Clients, Site Officers, or Admins can raise RFIs."
            )

        project = serializer.validated_data.get("project")

        from projects.models import ProjectMember

        if not ProjectMember.objects.filter(
            project=project, user=self.request.user
        ).exists():
            raise PermissionDenied(
                "You do not have permission to create an RFI for this project."
            )

        serializer.save(submitted_by=self.request.user)

    def perform_destroy(self, instance):
        if instance.status in ("ANSWERED", "CLOSED"):
            raise PermissionDenied(
                "Cannot delete an RFI that has already been answered."
            )

        if (
            instance.submitted_by != self.request.user
            and self.request.user.role not in ("AGENT", "ADMIN")
        ):
            raise PermissionDenied(
                "Only the original submitter or an Agent/Admin can delete this RFI."
            )

        instance.delete()

    def perform_update(self, serializer):
        rfi = self.get_object()
        if rfi.status in ("ANSWERED", "CLOSED") and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            raise PermissionDenied("Cannot edit an RFI that has already been answered.")

        if rfi.submitted_by != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            raise PermissionDenied(
                "Only the original submitter or an Agent/Admin can edit this RFI."
            )

        serializer.save()

    @action(detail=True, methods=["post"], url_path="answer")
    def answer(self, request, pk=None):
        rfi = self.get_object()

        if request.user.role not in ("SITE_OFFICER", "AGENT", "ADMIN"):
            return Response(
                {"detail": "Only Site Officers, Agents, or Admins can answer RFIs."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        if request.user.role == "SITE_OFFICER" and rfi.submitted_by == request.user:
            return Response(
                {"detail": "Site Officers cannot answer their own RFIs."},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        if rfi.status in ("ANSWERED", "CLOSED"):
            return Response(
                {"detail": f"This RFI is already {rfi.status.lower()}."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        response_text = request.data.get("response", "").strip()
        if not response_text:
            return Response(
                {"detail": "A response text is required to answer an RFI."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        rfi.response = response_text
        rfi.status = "ANSWERED"
        rfi.assigned_to = request.user
        rfi.save()

        serializer = self.get_serializer(rfi)
        return Response(serializer.data, status=http_status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        rfi = self.get_object()

        if rfi.submitted_by != request.user:
            return Response(
                {
                    "detail": "Only the original submitter can approve and close this RFI."
                },
                status=http_status.HTTP_403_FORBIDDEN,
            )

        if rfi.status != "ANSWERED":
            return Response(
                {"detail": f"Cannot approve an RFI that is {rfi.status.lower()}."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        rfi.status = "CLOSED"
        rfi.closed_at = timezone.now()
        rfi.save()

        serializer = self.get_serializer(rfi)
        return Response(serializer.data, status=http_status.HTTP_200_OK)
