from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.db import transaction

from rest_framework import status, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema, inline_serializer

from .serializers import (
    LoginSerializer,
    MagicLinkRequestSerializer,
    UserProfileSerializer,
    AdminUserListSerializer,
)
from .models import User
from datetime import timedelta
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


TokenResponseSchema = inline_serializer(
    name="TokenResponse",
    fields={
        "refresh": serializers.CharField(),
        "access": serializers.CharField(),
    },
)

DetailResponseSchema = inline_serializer(
    name="DetailResponse", fields={"detail": serializers.CharField()}
)


class VerifyTokenRequestSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=255, trim_whitespace=True)


class LoginView(APIView):
    authentication_classes = ()
    permission_classes = [AllowAny]

    def get_authenticate_header(self, request):
        return 'Bearer realm="api"'

    @extend_schema(request=LoginSerializer, responses={200: TokenResponseSchema})
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)

        user_data = UserProfileSerializer(user).data

        response = Response(
            {
                "access": str(refresh.access_token),
                "user": user_data,
            },
            status=status.HTTP_200_OK,
        )

        response.set_cookie(
            "access",
            str(refresh.access_token),
            httponly=True,
            samesite="Lax" if settings.DEBUG else "Strict",
            secure=not settings.DEBUG,
            max_age=900,  # 15 minutes, matching token lifetime
        )
        response.set_cookie(
            "refresh_token",
            str(refresh),
            httponly=True,
            samesite="Lax" if settings.DEBUG else "Strict",
            secure=not settings.DEBUG,
            max_age=604800,  # 7 days
        )
        return response


class RequestMagicLinkView(APIView):
    authentication_classes = ()
    permission_classes = [AllowAny]

    @extend_schema(
        request=MagicLinkRequestSerializer, responses={200: DetailResponseSchema}
    )
    def post(self, request):
        serializer = MagicLinkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()

        try:
            with transaction.atomic():
                user = User.objects.select_for_update().get(email=email)
                token = get_random_string(length=64)
                user.magic_token = token
                user.token_expiry = timezone.now() + timedelta(minutes=15)
                user.save(update_fields=["magic_token", "token_expiry"])

                frontend_url = getattr(
                    settings, "FRONTEND_URL", "http://localhost:3000"
                )
                magic_link = f"{frontend_url}/auth/verify?token={token}"

                send_mail(
                    subject="Your ConstructIQ Login Link",
                    message=f"Click here to log in: {magic_link}\n\nThis link expires in 15 minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[user.email],
                    fail_silently=False,
                )
        except User.DoesNotExist:
            pass

        return Response(
            {
                "detail": "If an account exists with this email, a login link has been sent."
            },
            status=status.HTTP_200_OK,
        )


class VerifyMagicLinkView(APIView):
    authentication_classes = ()
    permission_classes = [AllowAny]

    @extend_schema(
        request=VerifyTokenRequestSerializer,
        responses={200: TokenResponseSchema, 400: DetailResponseSchema},
    )
    def post(self, request):

        serializer = VerifyTokenRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        if not token:
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.select_for_update().filter(magic_token=token).first()

            if not user:
                return Response(
                    {"detail": "Invalid or expired token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if user.token_expiry is None or timezone.now() > user.token_expiry:
                user.magic_token = ""
                user.token_expiry = None
                user.save(update_fields=["magic_token", "token_expiry"])
                return Response(
                    {"detail": "Invalid or expired token."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.magic_token = ""
            user.token_expiry = None
            user.save(update_fields=["magic_token", "token_expiry"])

            refresh = RefreshToken.for_user(user)
            user_data = UserProfileSerializer(user).data

            response = Response(
                {
                    "access": str(refresh.access_token),
                    "user": user_data,
                },
                status=status.HTTP_200_OK,
            )

            response.set_cookie(
                "access",
                str(refresh.access_token),
                httponly=True,
                samesite="Lax" if settings.DEBUG else "Strict",
                secure=not settings.DEBUG,
                max_age=900,
            )
            response.set_cookie(
                "refresh_token",
                str(refresh),
                httponly=True,
                samesite="Lax" if settings.DEBUG else "Strict",
                secure=not settings.DEBUG,
                max_age=604800,
            )
            return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except (TokenError, InvalidToken):
                pass

        response = Response(
            {"detail": "Successfully logged out."}, status=status.HTTP_200_OK
        )
        response.delete_cookie("access", samesite="Lax" if settings.DEBUG else "Strict")
        response.delete_cookie(
            "refresh_token", samesite="Lax" if settings.DEBUG else "Strict"
        )
        return response


from rest_framework_simplejwt.views import TokenRefreshView  # noqa: E402


class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"detail": "No refresh token provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        request.data["refresh"] = refresh_token
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            access_token = response.data.get("access")

            if access_token:
                response.set_cookie(
                    "access",
                    access_token,
                    httponly=True,
                    samesite="Lax" if settings.DEBUG else "Strict",
                    secure=not settings.DEBUG,
                    max_age=900,
                )

            if "refresh" in response.data:
                new_refresh_token = response.data.pop("refresh")
                response.set_cookie(
                    "refresh_token",
                    new_refresh_token,
                    httponly=True,
                    samesite="Lax" if settings.DEBUG else "Strict",
                    secure=not settings.DEBUG,
                    max_age=604800,
                )

        return response


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: UserProfileSerializer})
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        request=UserProfileSerializer, responses={200: UserProfileSerializer}
    )
    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


from rest_framework import viewsets  # noqa: E402
from .permissions import IsAgentOrAdmin  # noqa: E402
from rest_framework.decorators import action  # noqa: E402


@extend_schema(tags=["Admin - Users"])
class AdminUserViewSet(viewsets.ModelViewSet):
    serializer_class = AdminUserListSerializer
    permission_classes = [IsAuthenticated, IsAgentOrAdmin]

    @action(detail=True, methods=["POST"])
    def toggle_status(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        return Response({"is_active": user.is_active, "status": "success"})

    @action(detail=True, methods=["POST"])
    def assign_project(self, request, pk=None):
        from projects.models import Project, ProjectMember

        user = self.get_object()
        project_id = request.data.get("project_id")
        default_role = (
            user.role
            if user.role in ["CLIENT", "AGENT", "SITE_OFFICER"]
            else "SITE_OFFICER"
        )
        role = request.data.get("role", default_role)

        if not project_id:
            return Response({"error": "project_id is required"}, status=400)

        project = Project.objects.filter(id=project_id).first()
        if not project:
            return Response({"error": "Project not found"}, status=404)

        member, created = ProjectMember.objects.get_or_create(
            user=user, project=project, defaults={"role": role}
        )

        if not created:
            if member.role != role:
                member.role = role
                member.save()

        return Response({"status": "assigned", "project": project.name}, status=201)

    @action(detail=True, methods=["POST"])
    def remove_from_project(self, request, pk=None):
        from projects.models import ProjectMember

        user = self.get_object()
        project_id = request.data.get("project_id")

        if not project_id:
            return Response({"error": "project_id is required"}, status=400)

        deleted_count, _ = ProjectMember.objects.filter(
            user=user, project_id=project_id
        ).delete()
        if deleted_count == 0:
            return Response(
                {"error": "User is not assigned to this project"}, status=404
            )

        return Response({"status": "removed"})

    def get_queryset(self):

        qs = (
            User.objects.prefetch_related("project_memberships__project")
            .all()
            .order_by("-date_joined")
        )

        role = self.request.query_params.get("role")
        if role:
            qs = qs.filter(role=role)
        else:
            qs = qs.exclude(role="ADMIN")

        return qs
