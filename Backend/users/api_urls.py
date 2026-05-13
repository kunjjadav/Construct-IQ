from rest_framework.routers import DefaultRouter
from .views import AdminUserViewSet

router = DefaultRouter()
router.register("admin/users", AdminUserViewSet, basename="admin-users")

urlpatterns = router.urls
