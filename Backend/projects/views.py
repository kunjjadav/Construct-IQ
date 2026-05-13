from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from django.utils import timezone
from django.db.models import Prefetch

from .models import Project, ProjectMember, Milestone, ProjectEvent
from .serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    ProjectMemberSerializer,
    MilestoneSerializer,
    ProjectEventSerializer,
)
from users.permissions import IsAgentOrAdmin


@extend_schema(tags=["Projects"])
class ProjectViewSet(viewsets.ModelViewSet):
    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectSerializer

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        else:
            return [permissions.IsAuthenticated(), IsAgentOrAdmin()]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Project.objects.none()

        base_qs = Project.objects.select_related("created_by").prefetch_related(
            Prefetch(
                "members",
                queryset=ProjectMember.objects.select_related("user").order_by(
                    "role", "invited_at"
                ),
            ),
            "milestones",
        )

        if user.role in ("AGENT", "ADMIN"):
            return base_qs.order_by("-created_at")

        return (
            base_qs.filter(members__user=user, members__is_frozen=False)
            .distinct()
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        from django.db import transaction
        from users.models import User
        from .models import Project, ProjectMember

        initial_status = Project.Status.PLANNING
        if self.request.user.role == "AGENT":
            initial_status = Project.Status.PENDING_APPROVAL

        initial_members = serializer.validated_data.pop("initial_members", [])

        with transaction.atomic():
            project = serializer.save(
                created_by=self.request.user, status=initial_status
            )

            if initial_members:
                user_ids = [
                    m.get("user_id") for m in initial_members if m.get("user_id")
                ]
                role_map = {
                    m["user_id"]: m["role"]
                    for m in initial_members
                    if m.get("user_id") and m.get("role")
                }
                users = User.objects.filter(id__in=user_ids)

                members_to_create = []
                for user_obj in users:
                    role = role_map.get(user_obj.id)
                    members_to_create.append(
                        ProjectMember(project=project, user=user_obj, role=role)
                    )

                if members_to_create:
                    ProjectMember.objects.bulk_create(
                        members_to_create, ignore_conflicts=True
                    )

    def perform_update(self, serializer):
        project = self.get_object()
        if "budget_total" in self.request.data:
            from decimal import Decimal

            new_budget = Decimal(self.request.data["budget_total"])
            if new_budget != project.budget_total:
                from rest_framework.exceptions import ValidationError

                raise ValidationError(
                    {
                        "budget_total": [
                            "Budget modifications MUST be executed via formally approved Change Orders."
                        ]
                    }
                )
        serializer.save()

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        has_approved_milestones = instance.milestones.filter(status="APPROVED").exists()
        has_approved_cos = instance.change_orders.filter(status="APPROVED").exists()

        if has_approved_milestones or has_approved_cos:
            raise PermissionDenied(
                "Cannot delete a project with approved milestones or change orders. Archive it instead."
            )

        instance.delete()

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        if request.user.role != "ADMIN":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only Admins can approve projects.")

        project = self.get_object()
        if project.status != "PENDING_APPROVAL":
            return Response(
                {"detail": "Project is not pending approval."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        project.status = "PLANNING"
        project.save(update_fields=["status"])

        serializer = self.get_serializer(project)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["Project Members"])
class ProjectMemberViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectMemberSerializer

    def get_permissions(self):
        if self.action in ("accept", "freeze", "unfreeze"):
            return [permissions.IsAuthenticated()]
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAgentOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ProjectMember.objects.none()

        qs = ProjectMember.objects.select_related("user").order_by("-invited_at")

        if user.role not in ("AGENT", "ADMIN"):
            user_project_ids = ProjectMember.objects.filter(user=user).values_list(
                "project_id", flat=True
            )
            qs = qs.filter(project_id__in=user_project_ids)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project = serializer.validated_data["project"]
        user = serializer.validated_data["user"]
        role = serializer.validated_data["role"]

        member, created = ProjectMember.objects.get_or_create(
            project=project, user=user, defaults={"role": role}
        )

        if not created and member.role != role:
            member.role = role
            member.save(update_fields=["role"])

        headers = self.get_success_headers(serializer.data) if created else {}
        return Response(
            self.get_serializer(member).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
            headers=headers,
        )

    @action(detail=True, methods=["post"], url_path="accept")
    def accept(self, request, pk=None):
        member = self.get_object()

        if member.user != request.user:
            return Response(
                {"detail": "You can only accept your own project invitation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if member.accepted_at is not None:
            return Response(
                {"detail": "This invitation has already been accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.accepted_at = timezone.now()
        member.save(update_fields=["accepted_at"])

        serializer = self.get_serializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="freeze")
    def freeze(self, request, pk=None):
        if request.user.role not in ("AGENT", "ADMIN"):
            return Response(
                {"detail": "Only Agents and Admins can freeze project members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = self.get_object()
        if member.is_frozen:
            return Response(
                {"detail": "This member is already frozen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.is_frozen = True
        member.save(update_fields=["is_frozen"])

        ProjectEvent.objects.create(
            project=member.project,
            event_type="MEMBER_FROZEN",
            actor=request.user,
            payload={
                "member_user_id": member.user.id,
                "member_email": member.user.email,
                "role": member.role,
            },
        )

        try:
            from notifications.services import notify_and_email

            notify_and_email(
                recipient=member.user,
                notification_type="SYSTEM_ALERT",
                message=f"Your access to project '{member.project.name}' has been temporarily suspended.",
                action_url="/projects",
                email_subject=f"Access Suspended: {member.project.name}",
                email_body=(
                    f"Hello,\n\n"
                    f"Your assignment as {member.get_role_display()} on the project "
                    f"'{member.project.name}' has been temporarily suspended by the project administrator.\n\n"
                    f"You will not be able to access this project until your access is restored.\n\n"
                    f"If you believe this is an error, please contact your project manager.\n\n"
                    f"Thank you,\n"
                    f"The ConstructIQ Team"
                ),
            )
        except Exception:
            pass

        serializer = self.get_serializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="unfreeze")
    def unfreeze(self, request, pk=None):
        if request.user.role not in ("AGENT", "ADMIN"):
            return Response(
                {"detail": "Only Agents and Admins can unfreeze project members."},
                status=status.HTTP_403_FORBIDDEN,
            )

        member = self.get_object()
        if not member.is_frozen:
            return Response(
                {"detail": "This member is not frozen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        member.is_frozen = False
        member.save(update_fields=["is_frozen"])

        ProjectEvent.objects.create(
            project=member.project,
            event_type="MEMBER_UNFROZEN",
            actor=request.user,
            payload={
                "member_user_id": member.user.id,
                "member_email": member.user.email,
                "role": member.role,
            },
        )

        try:
            from notifications.services import notify_and_email

            notify_and_email(
                recipient=member.user,
                notification_type="SYSTEM_ALERT",
                message=f"Your access to project '{member.project.name}' has been restored.",
                action_url="/projects",
                email_subject=f"Access Restored: {member.project.name}",
                email_body=(
                    f"Hello,\n\n"
                    f"Your assignment as {member.get_role_display()} on the project "
                    f"'{member.project.name}' has been restored by the project administrator.\n\n"
                    f"You can now access the project as before.\n\n"
                    f"Thank you,\n"
                    f"The ConstructIQ Team"
                ),
            )
        except Exception:
            pass

        serializer = self.get_serializer(member)
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["Milestones"])
class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer

    def get_permissions(self):
        if self.action == "approve":
            return [permissions.IsAuthenticated()]
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsAgentOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Milestone.objects.none()

        qs = Milestone.objects.all().order_by("due_date")

        if user.role not in ("AGENT", "ADMIN"):
            user_project_ids = ProjectMember.objects.filter(user=user).values_list(
                "project_id", flat=True
            )
            qs = qs.filter(project_id__in=user_project_ids)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs

    def perform_update(self, serializer):
        milestone = self.get_object()
        from rest_framework.exceptions import PermissionDenied

        if milestone.status == "APPROVED":
            raise PermissionDenied(
                "Cannot modify a milestone that has already received formal approval. Financial records are read-only."
            )

        serializer.save()

    def perform_destroy(self, instance):
        from rest_framework.exceptions import PermissionDenied

        if instance.status == "APPROVED":
            raise PermissionDenied("Cannot delete a finalized milestone payment.")

        instance.delete()

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        from django.db import transaction

        with transaction.atomic():
            from django.shortcuts import get_object_or_404

            milestone = get_object_or_404(
                self.get_queryset().select_for_update(), pk=pk
            )

            if request.user.role != "CLIENT":
                return Response(
                    {"detail": "Only a Client can authorize a milestone payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            if milestone.status == "APPROVED":
                return Response(
                    {"detail": "This milestone is already approved."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = request.data.get("approval_token")
            if not token or str(milestone.approval_token) != token:
                return Response(
                    {"detail": "Invalid or missing approval token."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            milestone.status = "APPROVED"
            milestone.approved_by = request.user
            milestone.completion_date = timezone.now().date()


            milestone.save(update_fields=["status", "approved_by", "completion_date"])

            serializer = self.get_serializer(milestone)
            return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(tags=["Project Events"])
class ProjectEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProjectEventSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ProjectEvent.objects.none()

        qs = ProjectEvent.objects.all().order_by("-created_at")

        if user.role not in ("AGENT", "ADMIN"):
            user_project_ids = ProjectMember.objects.filter(user=user).values_list(
                "project_id", flat=True
            )
            qs = qs.filter(project_id__in=user_project_ids)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs
