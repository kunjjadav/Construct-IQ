from rest_framework import serializers
from .models import Project, ProjectMember, Milestone, ProjectEvent


class TeamMemberSerializer(serializers.ModelSerializer):
    member_id = serializers.ReadOnlyField(source="id")
    email = serializers.ReadOnlyField(source="user.email")
    phone = serializers.ReadOnlyField(source="user.phone")
    user_id = serializers.ReadOnlyField(source="user.id")
    role = serializers.ReadOnlyField()
    invited_at = serializers.ReadOnlyField()
    accepted_at = serializers.ReadOnlyField()
    is_frozen = serializers.ReadOnlyField()

    class Meta:
        model = ProjectMember
        fields = [
            "member_id",
            "user_id",
            "email",
            "phone",
            "role",
            "invited_at",
            "accepted_at",
            "is_frozen",
        ]


class ProjectSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source="created_by.email")
    member_count = serializers.SerializerMethodField()
    initial_members = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False
    )

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "address",
            "status",
            "budget_total",
            "budget_spent",
            "completion_pct",
            "created_by",
            "created_by_email",
            "member_count",
            "initial_members",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "budget_spent",
            "completion_pct",
            "created_at",
            "updated_at",
        ]

    def get_member_count(self, obj):
        return len(obj.members.all())


class ProjectDetailSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source="created_by.email")
    team = serializers.SerializerMethodField()
    milestones_summary = serializers.SerializerMethodField()
    recent_activity = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            "id",
            "name",
            "address",
            "status",
            "budget_total",
            "budget_spent",
            "completion_pct",
            "created_by",
            "created_by_email",
            "team",
            "milestones_summary",
            "recent_activity",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "budget_spent",
            "completion_pct",
            "created_at",
            "updated_at",
        ]

    def get_team(self, obj):
        request = self.context.get("request")
        user = request.user if request else None

        members = obj.members.all()

        team_data = {
            "clients": [],
            "agents": [],
            "site_officers": [],
        }

        for member in members:
            if user and member.user_id == user.id:
                continue

            show_member = False
            if not user or user.role == "ADMIN":
                show_member = True
            elif user.role == "AGENT":
                show_member = member.role in ("CLIENT", "SITE_OFFICER")
            elif user.role == "SITE_OFFICER":
                show_member = member.role == "CLIENT"
            elif user.role == "CLIENT":
                show_member = member.role in ("AGENT", "SITE_OFFICER")

            if show_member:
                member_data = TeamMemberSerializer(member).data
                if member.role == "CLIENT":
                    team_data["clients"].append(member_data)
                elif member.role == "AGENT":
                    team_data["agents"].append(member_data)
                elif member.role == "SITE_OFFICER":
                    team_data["site_officers"].append(member_data)

        return team_data

    def get_milestones_summary(self, obj):
        milestones = obj.milestones.all()
        return {
            "total": len(milestones),
            "approved": sum(1 for m in milestones if m.status == "APPROVED"),
            "in_progress": sum(1 for m in milestones if m.status == "IN_PROGRESS"),
            "pending_approval": sum(
                1 for m in milestones if m.status == "PENDING_APPROVAL"
            ),
            "not_started": sum(1 for m in milestones if m.status == "NOT_STARTED"),
        }

    def get_recent_activity(self, obj):
        recent_events = obj.events.select_related("actor").order_by("-created_at")[:5]
        return [
            {
                "event_type": event.event_type,
                "actor_email": event.actor.email,
                "created_at": event.created_at,
                "payload": event.payload,
            }
            for event in recent_events
        ]


class ProjectMemberSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source="user.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    class Meta:
        model = ProjectMember
        fields = [
            "id",
            "project",
            "project_name",
            "user",
            "user_email",
            "role",
            "invited_at",
            "accepted_at",
            "is_frozen",
        ]
        read_only_fields = ["id", "invited_at", "accepted_at", "is_frozen"]
        validators = []

    def validate(self, attrs):
        user = attrs.get("user")
        role = attrs.get("role")

        if user and role:
            valid_role_map = {
                "CLIENT": ["CLIENT"],
                "SITE_OFFICER": ["SITE_OFFICER"],
                "AGENT": ["AGENT"],
                "ADMIN": ["AGENT"],
            }

            allowed_roles = valid_role_map.get(user.role, [])
            if role not in allowed_roles:
                raise serializers.ValidationError(
                    {
                        "role": f"Cannot assign a {user.get_role_display()} to the project as a {role}."
                    }
                )

        return attrs


class MilestoneSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source="project.name")
    approved_by_email = serializers.ReadOnlyField(source="approved_by.email")

    class Meta:
        model = Milestone
        fields = [
            "id",
            "project",
            "project_name",
            "name",
            "due_date",
            "completion_date",
            "payment_amount",
            "status",
            "approved_by",
            "approved_by_email",
            "approval_token",
        ]
        read_only_fields = [
            "id",
            "status",
            "completion_date",
            "approved_by",
            "approval_token",
        ]

    def validate_payment_amount(self, value):
        from decimal import Decimal

        if value <= Decimal("0"):
            from rest_framework import serializers

            raise serializers.ValidationError(
                "Milestone payment amount must be greater than zero."
            )
        return value


class ProjectEventSerializer(serializers.ModelSerializer):
    actor_email = serializers.ReadOnlyField(source="actor.email")
    project_name = serializers.ReadOnlyField(source="project.name")

    class Meta:
        model = ProjectEvent
        fields = [
            "id",
            "project",
            "project_name",
            "actor",
            "actor_email",
            "event_type",
            "payload",
            "created_at",
        ]
