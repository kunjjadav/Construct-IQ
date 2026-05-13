from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MaintenanceRequestViewSet, NotificationViewSet

router = DefaultRouter()
router.register(
    r"maintenance-requests", MaintenanceRequestViewSet, basename="maintenance-request"
)
router.register(r"notifications", NotificationViewSet, basename="notification")

app_name = "notifications"

urlpatterns = [
    path("", include(router.urls)),
]
