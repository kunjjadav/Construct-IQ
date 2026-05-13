from django.conf import settings
from django.db import models
from django.db.models import Q


class Document(models.Model):
    class FileType(models.TextChoices):
        PDF = "PDF", "PDF"
        DWG = "DWG", "AutoCAD Drawing"
        IFC = "IFC", "IFC (BIM)"
        DOCX = "DOCX", "Word Document"
        XLSX = "XLSX", "Excel Spreadsheet"
        IMAGE = "IMAGE", "Image"
        OTHER = "OTHER", "Other"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="documents",
    )

    title = models.CharField(max_length=255, db_index=True)
    version = models.PositiveIntegerField(default=1)

    s3_key = models.CharField(max_length=500, blank=True, default="")
    file_type = models.CharField(
        max_length=10,
        choices=FileType.choices,
        default=FileType.OTHER,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_documents",
    )
    is_current = models.BooleanField(default=True)

    checksum = models.CharField(max_length=64, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "documents"

        constraints = [
            models.UniqueConstraint(
                fields=["project", "title", "version"], name="unique_document_version"
            ),
            models.UniqueConstraint(
                fields=["project", "title"],
                condition=Q(is_current=True),
                name="unique_current_document",
            ),
        ]

        indexes = [
            models.Index(fields=["project", "title", "-version"]),
        ]

    def __str__(self):
        return f"{self.title} (v{self.version})"
