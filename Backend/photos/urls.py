from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PhotoViewSet, WeeklyLogViewSet

router = DefaultRouter()
router.register(r"photos", PhotoViewSet, basename="photo")
router.register(r"weekly-logs", WeeklyLogViewSet, basename="weekly-log")

app_name = "photos"

urlpatterns = [
    path("", include(router.urls)),
]
