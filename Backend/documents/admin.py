from django.contrib import admin
from .models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "project",
        "version",
        "file_type",
        "is_current",
        "uploaded_by",
        "created_at",
    )
    list_filter = ("file_type", "is_current")
    search_fields = ("title", "project__name")
    ordering = ("-created_at",)
