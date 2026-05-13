from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model


class EmailAuthenticationBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()

        email = username or kwargs.get("email")

        if not email:
            return None

        try:
            user = UserModel.objects.get(email__iexact=email)
        except UserModel.DoesNotExist:
            return None

        if user.check_password(password):
            if not user.is_active:
                from rest_framework.exceptions import AuthenticationFailed

                raise AuthenticationFailed(
                    "This account has been deactivated. Please contact support."
                )
            return user

        return None
