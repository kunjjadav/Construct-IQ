from django.contrib import admin
from .models import RFI


@admin.register(RFI)
class RFIAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "status",
        "submitted_by",
        "assigned_to",
        "due_date",
        "created_at",
    )
    list_filter = ("status",)
    search_fields = ("title", "project__name")
    ordering = ("-created_at",)
