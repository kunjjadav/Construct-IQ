import uuid
from django.conf import settings
from django.db import models
from decimal import Decimal


class ChangeOrder(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        PENDING_APPROVAL = "PENDING", "Pending Approval"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="change_orders",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="created_change_orders",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    reason_code = models.CharField(max_length=100, blank=True, default="")

    cost_impact = models.DecimalField(
        max_digits=12, decimal_places=2, default=Decimal("0.00")
    )
    schedule_impact_days = models.IntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    approval_token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_change_orders",
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    signature_hash = models.CharField(max_length=255, blank=True, default="")
    pdf_s3_key = models.CharField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "change_orders"
        ordering = ["-created_at"]

    def __str__(self):
        return f"CO #{self.pk}: {self.title} ({self.status})"
