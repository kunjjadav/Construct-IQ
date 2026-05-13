from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChangeOrderViewSet

router = DefaultRouter()
router.register(r"change-orders", ChangeOrderViewSet, basename="change-order")

app_name = "change_orders"

urlpatterns = [
    path("", include(router.urls)),
]
