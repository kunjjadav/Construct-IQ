from rest_framework import serializers
from .models import MaintenanceRequest, Notification


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    reporter_email = serializers.ReadOnlyField(source="reporter.email")
    assigned_agent_email = serializers.ReadOnlyField(source="assigned_agent.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    class Meta:
        model = MaintenanceRequest
        fields = [
            "id",
            "project",
            "project_name",
            "reporter",
            "reporter_email",
            "assigned_agent",
            "assigned_agent_email",
            "title",
            "description",
            "priority",
            "status",
            "requested_visit_date",
            "resolution_notes",
            "resolved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reporter",
            "reporter_email",
            "assigned_agent_email",
            "project_name",
            "resolved_at",
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "recipient",
            "notification_type",
            "message",
            "action_url",
            "is_read",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "recipient",
            "notification_type",
            "message",
            "action_url",
            "created_at",
        ]
