import hashlib
import uuid
import mimetypes
from django.db import transaction
from django.core.files.storage import default_storage
from django.http import HttpResponse
from rest_framework import viewsets, permissions, parsers, status
from rest_framework.response import Response
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema

from .models import Document
from .serializers import DocumentSerializer


@extend_schema(tags=["Documents"])
class DocumentViewSet(viewsets.ModelViewSet):
    serializer_class = DocumentSerializer
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Document.objects.none()

        qs = Document.objects.select_related("project", "uploaded_by").order_by(
            "title", "-version"
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

        if request.user.role == "CLIENT":
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Clients cannot upload documents. Use the provided Client portal for viewing."
            )

        project = serializer.validated_data["project"]
        title = serializer.validated_data["title"]
        file_type = serializer.validated_data["file_type"]
        uploaded_file = serializer.validated_data.pop("file")

        if request.user.role not in ("AGENT", "ADMIN"):
            from projects.models import ProjectMember

            if not ProjectMember.objects.filter(
                project=project, user=request.user
            ).exists():
                return Response(
                    {
                        "detail": "You do not have permission to upload documents to this project."
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        if "." not in uploaded_file.name:
            return Response(
                {"file": ["File must have a valid extension."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        sha_hash = hashlib.sha256()
        for chunk in uploaded_file.chunks():
            sha_hash.update(chunk)
        checksum = sha_hash.hexdigest()

        uploaded_file.seek(0)

        ext = uploaded_file.name.rsplit(".", 1)[-1].lower()
        unique_filename = f"projects/{project.id}/docs/{uuid.uuid4().hex}.{ext}"
        saved_path = default_storage.save(unique_filename, uploaded_file)

        with transaction.atomic():
            existing_docs = Document.objects.filter(
                project=project, title=title
            ).select_for_update()

            if existing_docs.exists():
                latest_doc = existing_docs.order_by("-version").first()
                new_version = latest_doc.version + 1
                existing_docs.update(is_current=False)
            else:
                new_version = 1

            doc = Document.objects.create(
                project=project,
                title=title,
                version=new_version,
                s3_key=saved_path,
                file_type=file_type,
                uploaded_by=request.user,
                is_current=True,
                checksum=checksum,
            )

        response_serializer = self.get_serializer(doc)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def perform_destroy(self, instance):
        if self.request.user.role not in ("AGENT", "ADMIN"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only Agents or Admins can delete documents.")
        instance.delete()

    def perform_update(self, serializer):
        if self.request.user.role not in ("AGENT", "ADMIN"):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied("Only Agents or Admins can edit documents.")
        serializer.save()

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        doc = self.get_object()

        if not default_storage.exists(doc.s3_key):
            return Response(
                {"detail": "File not found on storage."},
                status=status.HTTP_404_NOT_FOUND,
            )

        file_handle = default_storage.open(doc.s3_key, "rb")
        content_type = mimetypes.guess_type(doc.s3_key)[0] or "application/octet-stream"

        response = HttpResponse(file_handle, content_type=content_type)
        safe_title = doc.title.replace('"', "").replace("\n", "").replace("\r", "")
        response["Content-Disposition"] = f'attachment; filename="{safe_title}"'
        return response
