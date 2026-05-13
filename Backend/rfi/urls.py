from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFIViewSet

router = DefaultRouter()
router.register(r"rfi", RFIViewSet, basename="rfi")

app_name = "rfi"

urlpatterns = [
    path("", include(router.urls)),
]
