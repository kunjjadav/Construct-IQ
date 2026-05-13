from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.db import connection
from django.utils import timezone
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from users.views import UserProfileView


def health_check(request):
    db_ok = False
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        db_ok = True
    except Exception:
        pass

    status_code = 200 if db_ok else 503
    return JsonResponse(
        {
            "status": "healthy" if db_ok else "unhealthy",
            "database": "connected" if db_ok else "disconnected",
            "timestamp": timezone.now().isoformat(),
            "version": "1.0.0",
        },
        status=status_code,
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("users.urls")),
    path("api/users/me/", UserProfileView.as_view(), name="user-profile"),
    path("api/", include("users.api_urls")),
    path("api/", include("projects.urls")),
    path("api/", include("documents.urls")),
    path("api/", include("photos.urls")),
    path("api/", include("rfi.urls")),
    path("api/", include("change_orders.urls")),
    path("api/", include("notifications.urls")),
    path("api/sync/", include("sync.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    path("api/health/", health_check, name="health-check"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
