from django.urls import path
from .views import (
    LoginView,
    RequestMagicLinkView,
    VerifyMagicLinkView,
    LogoutView,
    CustomTokenRefreshView,
)

app_name = "users"

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("magic-link/", RequestMagicLinkView.as_view(), name="magic-link"),
    path("verify/", VerifyMagicLinkView.as_view(), name="verify"),
]
