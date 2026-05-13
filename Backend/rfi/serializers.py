from rest_framework import serializers
from .models import RFI


class RFISerializer(serializers.ModelSerializer):
    submitted_by_email = serializers.ReadOnlyField(source="submitted_by.email")
    assigned_to_email = serializers.ReadOnlyField(source="assigned_to.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    class Meta:
        model = RFI
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "location_ref",
            "response",
            "status",
            "submitted_by",
            "submitted_by_email",
            "assigned_to",
            "assigned_to_email",
            "due_date",
            "closed_at",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "submitted_by",
            "status",
            "response",
            "closed_at",
            "created_at",
            "updated_at",
        ]
