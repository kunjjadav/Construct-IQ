from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import RegexValidator


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        style={"input_type": "password"}, trim_whitespace=False
    )

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"), email=email, password=password
        )

        from rest_framework.exceptions import AuthenticationFailed

        if not user:
            raise AuthenticationFailed("Invalid email or password.")

        if not user.is_active:
            raise AuthenticationFailed("This account has been deactivated.")

        attrs["user"] = user
        return attrs


class MagicLinkRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class UserProfileSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True,
        validators=[
            RegexValidator(
                regex=r"^\+?1?\d{9,15}$",
                message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
            )
        ],
    )

    class Meta:
        from .models import User

        model = User
        fields = ["id", "email", "role", "phone", "is_active", "date_joined"]
        read_only_fields = ["id", "email", "role", "is_active", "date_joined"]


class UserProjectAssignmentSerializer(serializers.ModelSerializer):
    project_id = serializers.IntegerField(source="project.id", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    project_status = serializers.CharField(source="project.status", read_only=True)

    class Meta:
        from projects.models import ProjectMember

        model = ProjectMember
        fields = [
            "project_id",
            "project_name",
            "project_status",
            "role",
            "invited_at",
            "accepted_at",
        ]


class AdminUserListSerializer(serializers.ModelSerializer):
    projects = serializers.SerializerMethodField()

    class Meta:
        from .models import User

        model = User
        fields = [
            "id",
            "email",
            "role",
            "phone",
            "is_active",
            "date_joined",
            "projects",
        ]

    def get_projects(self, obj):
        memberships = obj.project_memberships.all()
        return UserProjectAssignmentSerializer(memberships, many=True).data
