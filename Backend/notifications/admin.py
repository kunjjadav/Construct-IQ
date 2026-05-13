from django.contrib import admin
from .models import MaintenanceRequest, Notification


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "priority",
        "status",
        "reporter",
        "assigned_agent",
        "created_at",
    )
    list_filter = ("priority", "status")
    search_fields = ("title", "project__name")
    ordering = ("-created_at",)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        "recipient",
        "notification_type",
        "message",
        "is_read",
        "created_at",
    )
    list_filter = ("notification_type", "is_read")
    search_fields = ("recipient__email", "message")
    ordering = ("-created_at",)
