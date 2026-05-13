from django.contrib import admin
from .models import ChangeOrder


@admin.register(ChangeOrder)
class ChangeOrderAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "status",
        "cost_impact",
        "schedule_impact_days",
        "created_by",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("title", "project__name")
    ordering = ("-created_at",)
