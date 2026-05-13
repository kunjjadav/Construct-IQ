from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProjectViewSet,
    ProjectMemberViewSet,
    MilestoneViewSet,
    ProjectEventViewSet,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"project-members", ProjectMemberViewSet, basename="project-member")
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"project-events", ProjectEventViewSet, basename="project-event")

app_name = "projects"

urlpatterns = [
    path("", include(router.urls)),
]
