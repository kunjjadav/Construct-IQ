import uuid
from django.core.files.storage import default_storage
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from .models import Photo, WeeklyLog
from .serializers import PhotoSerializer, WeeklyLogSerializer

THUMBNAIL_SIZE = (300, 300)
THUMBNAIL_QUALITY = 85


@extend_schema(tags=["Photos"])
class PhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PhotoSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Photo.objects.none()

        qs = Photo.objects.select_related("project", "uploaded_by").order_by(
            "-created_at"
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

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        project = serializer.validated_data.pop("project")
        uploaded_file = serializer.validated_data.pop("file")

        if request.user.role == "CLIENT":
            return Response(
                {"detail": "Clients cannot upload site photos."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if request.user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            if not ProjectMember.objects.filter(
                project=project, user=request.user
            ).exists():
                return Response(
                    {
                        "detail": "You do not have permission to upload photos to this project."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        parts = uploaded_file.name.rsplit(".", 1)
        ext = parts[-1].lower() if len(parts) > 1 else "jpg"
        s3_key_path = f"projects/{project.id}/photos/{uuid.uuid4().hex}.{ext}"

        saved_path = default_storage.save(s3_key_path, uploaded_file)

        photo = Photo.objects.create(
            project=project,
            uploaded_by=request.user,
            s3_key=saved_path,
            **serializer.validated_data,
        )

        from .tasks import process_photo_upload

        process_photo_upload.delay(photo.id)

        response_serializer = self.get_serializer(photo)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        if instance.uploaded_by != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only the uploader or an Agent/Admin can delete this photo."
            )
        instance.delete()

    def perform_update(self, serializer):
        photo = self.get_object()
        if photo.uploaded_by != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only the uploader or an Agent/Admin can edit this photo."
            )
        serializer.save()


@extend_schema(tags=["Weekly Logs"])
class WeeklyLogViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklyLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return WeeklyLog.objects.none()

        qs = WeeklyLog.objects.select_related("project", "site_officer").order_by(
            "-week_start_date"
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

        return qs

    def perform_create(self, serializer):
        project = serializer.validated_data.get("project")

        if self.request.user.role == "CLIENT":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Clients cannot submit daily logs.")

        if self.request.user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            if not ProjectMember.objects.filter(
                project=project, user=self.request.user
            ).exists():
                from rest_framework.exceptions import PermissionDenied

                raise PermissionDenied(
                    "You do not have permission to submit weekly logs for this project."
                )

        week_start_date = serializer.validated_data.get("week_start_date")
        from datetime import date

        if week_start_date and week_start_date > date.today():
            from rest_framework.exceptions import ValidationError

            raise ValidationError(
                {"week_start_date": "You cannot submit a weekly log for a future date."}
            )

        serializer.save(site_officer=self.request.user)

    @action(detail=True, methods=["post"], url_path="submit")
    def submit(self, request, pk=None):
        weekly_log = self.get_object()

        if weekly_log.site_officer != request.user:
            return Response(
                {"detail": "You can only submit your own weekly log."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if weekly_log.status == "SUBMITTED":
            return Response(
                {"detail": "This weekly log has already been submitted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not weekly_log.notes.strip():
            return Response(
                {"detail": "Cannot submit an empty log. Please add notes first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        weekly_log.status = "SUBMITTED"
        weekly_log.save(update_fields=["status", "updated_at"])

        serializer = self.get_serializer(weekly_log)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def perform_destroy(self, instance):
        if instance.status == "SUBMITTED":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Cannot delete a submitted weekly log.")
        if (
            instance.site_officer != self.request.user
            and self.request.user.role not in ("AGENT", "ADMIN")
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only the author or an Agent/Admin can delete this weekly log."
            )
        instance.delete()

    def perform_update(self, serializer):
        log = self.get_object()
        if log.status == "SUBMITTED":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Cannot edit a submitted weekly log.")
        if log.site_officer != self.request.user and self.request.user.role not in (
            "AGENT",
            "ADMIN",
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Only the author or an Agent/Admin can edit this weekly log."
            )
        serializer.save()

    @action(detail=True, methods=["post"], url_path="export-pdf")
    def export_pdf(self, request, pk=None):
        weekly_log = self.get_object()

        if weekly_log.status != "SUBMITTED":
            return Response(
                {"detail": "Only submitted weekly logs can be exported to PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import generate_weekly_log_pdf

        generate_weekly_log_pdf.delay(weekly_log.id)

        return Response(
            {
                "detail": "PDF generation started. You will receive a notification when it's ready."
            },
            status=status.HTTP_202_ACCEPTED,
        )
