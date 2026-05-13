from django.contrib import admin
from .models import Photo, WeeklyLog


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = (
        "pk",
        "project",
        "uploaded_by",
        "caption",
        "lat",
        "lon",
        "created_at",
    )
    list_filter = ("project",)
    search_fields = ("caption", "project__name")
    ordering = ("-created_at",)


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = (
        "project",
        "site_officer",
        "week_start_date",
        "weather",
        "crew_count",
        "budget_used",
        "status",
    )
    list_filter = ("status", "weather")
    search_fields = ("project__name", "site_officer__email")
    ordering = ("-week_start_date",)
