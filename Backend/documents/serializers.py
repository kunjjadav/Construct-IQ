from rest_framework import serializers
from .models import Document


class DocumentSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.ReadOnlyField(source="uploaded_by.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    file = serializers.FileField(write_only=True, required=True)

    class Meta:
        model = Document
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "version",
            "s3_key",
            "file_type",
            "uploaded_by",
            "uploaded_by_email",
            "is_current",
            "checksum",
            "created_at",
            "file",
        ]

        read_only_fields = [
            "id",
            "version",
            "s3_key",
            "uploaded_by",
            "is_current",
            "checksum",
            "created_at",
        ]

        validators = []
