from rest_framework import serializers
from .models import ChangeOrder


class ChangeOrderSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source="project.name")
    created_by_email = serializers.ReadOnlyField(source="created_by.email")
    approved_by_email = serializers.ReadOnlyField(source="approved_by.email")

    class Meta:
        model = ChangeOrder
        fields = [
            "id",
            "project",
            "project_name",
            "title",
            "description",
            "reason_code",
            "cost_impact",
            "schedule_impact_days",
            "status",
            "created_by",
            "created_by_email",
            "approved_by",
            "approved_by_email",
            "approved_at",
            "signature_hash",
            "pdf_s3_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "created_by",
            "approved_by",
            "approved_at",
            "signature_hash",
            "pdf_s3_key",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        cost = attrs.get("cost_impact", getattr(self.instance, "cost_impact", 0))
        schedule = attrs.get(
            "schedule_impact_days", getattr(self.instance, "schedule_impact_days", 0)
        )

        from decimal import Decimal

        if cost == Decimal("0") and schedule == 0:
            from rest_framework import serializers

            raise serializers.ValidationError(
                "A Change Order must alter either the project budget or the schedule."
            )

        return attrs
