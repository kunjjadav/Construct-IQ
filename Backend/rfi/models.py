from django.conf import settings
from django.db import models


class RFI(models.Model):
    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        PENDING_RESPONSE = "PENDING_RESPONSE", "Pending Response"
        ANSWERED = "ANSWERED", "Answered"
        CLOSED = "CLOSED", "Closed"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="rfis",
    )

    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="submitted_rfis",
    )

    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_rfis",
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    location_ref = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
        db_index=True,
    )

    due_date = models.DateField(null=True, blank=True)
    response = models.TextField(blank=True, default="")
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rfis"
        ordering = ["-created_at"]
        verbose_name = "RFI"
        verbose_name_plural = "RFIs"

    def __str__(self):
        return f"RFI: {self.title}"
