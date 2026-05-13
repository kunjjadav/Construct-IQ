from rest_framework import viewsets, permissions, mixins
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema
from .models import MaintenanceRequest, Notification
from .serializers import MaintenanceRequestSerializer, NotificationSerializer


@extend_schema(tags=["Maintenance Requests"])
class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return MaintenanceRequest.objects.none()

        qs = MaintenanceRequest.objects.select_related(
            "project", "reporter", "assigned_agent"
        )

        if user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            user_project_ids = ProjectMember.objects.filter(user=user).values_list(
                "project_id", flat=True
            )
            qs = qs.filter(project_id__in=user_project_ids)

        project_id = self.request.query_params.get("project")
        if project_id:
            qs = qs.filter(project_id=project_id)

        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        project = serializer.validated_data.get("project")

        if self.request.user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            if not ProjectMember.objects.filter(
                project=project, user=self.request.user
            ).exists():
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "You do not have permission to log a maintenance request for this project."
                )

        serializer.save(reporter=self.request.user)

    def perform_destroy(self, instance):
        if self.request.user.role not in ("AGENT", "ADMIN"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only Agents or Admins can delete maintenance requests."
            )
        instance.delete()

    def perform_update(self, serializer):
        request = self.get_object()
        if request.reporter != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only the reporter or an Agent/Admin can edit this maintenance request."
            )
        serializer.save()


@extend_schema(tags=["Notifications"])
class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(recipient=user).order_by("-created_at")

    @action(detail=False, methods=["post"], url_path="mark-all-read")
    def mark_all_read(self, request):
        user = request.user
        updated_count = Notification.objects.filter(
            recipient=user, is_read=False
        ).update(is_read=True)
        return Response(
            {
                "detail": f"Marked {updated_count} notifications as read.",
                "updated_count": updated_count,
            }
        )
