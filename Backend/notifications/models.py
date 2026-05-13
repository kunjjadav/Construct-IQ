from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator


class MaintenanceRequest(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        CRITICAL = "CRITICAL", "Critical"

    class Status(models.TextChoices):
        REPORTED = "REPORTED", "Reported"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"
        CLOSED = "CLOSED", "Closed"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="maintenance_requests",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_issues",
    )

    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_maintenance",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()

    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REPORTED,
    )

    requested_visit_date = models.DateField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True, default="")
    resolved_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "maintenance_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Issue: {self.title} ({self.status})"


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        RFI_ASSIGNED = "RFI_ASSIGNED", "RFI Assigned"
        RFI_ANSWERED = "RFI_ANSWERED", "RFI Answered"
        CO_PENDING = "CO_PENDING", "Change Order Pending"
        CO_APPROVED = "CO_APPROVED", "Change Order Approved"
        MAINTENANCE_LOGGED = "MAINTENANCE_LOGGED", "Maintenance Logged"
        GENERAL_UPDATE = "GENERAL_UPDATE", "General Update"
        SYSTEM_ALERT = "SYSTEM_ALERT", "System Alert"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL_UPDATE,
    )

    message = models.CharField(max_length=255)

    action_url = models.CharField(
        max_length=500,
        blank=True,
        default="",
        validators=[
            RegexValidator(
                regex=r"^\/(?!.*(?:\.\.|//))[a-zA-Z0-9\-\/\?\=\&\.\_\#\%]*$",
                message="action_url must be a valid relative path starting with '/' and must not contain traversal characters",
            )
        ],
    )

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"To {self.recipient.email}: {self.message}"
