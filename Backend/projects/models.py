import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

try:
    from django.contrib.postgres.indexes import GinIndex
except ImportError:
    GinIndex = None


class Project(models.Model):
    class Status(models.TextChoices):
        PLANNING = "PLANNING", "Planning"
        ACTIVE = "ACTIVE", "Active"
        ON_HOLD = "ON_HOLD", "On Hold"
        COMPLETED = "COMPLETED", "Completed"
        ARCHIVED = "ARCHIVED", "Archived"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"

    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PLANNING,
        db_index=True,  # Critical O(1) read path for filtering active projects vs archived
    )

    budget_total = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    budget_spent = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    completion_pct = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="owned_projects",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "projects"
        ordering = ["-created_at"]

    def __str__(self):
        return self.name


class ProjectEvent(models.Model):
    class EventType(models.TextChoices):
        CREATED = "CREATED", "Created"
        UPDATED = "UPDATED", "Updated"
        STATUS_CHANGED = "STATUS_CHANGED", "Status Changed"
        MEMBER_ADDED = "MEMBER_ADDED", "Member Added"
        MEMBER_REMOVED = "MEMBER_REMOVED", "Member Removed"
        MEMBER_FROZEN = "MEMBER_FROZEN", "Member Frozen"
        MEMBER_UNFROZEN = "MEMBER_UNFROZEN", "Member Unfrozen"
        DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED", "Document Uploaded"
        RFI_CREATED = "RFI_CREATED", "RFI Created"
        RFI_ANSWERED = "RFI_ANSWERED", "RFI Answered"
        CHANGE_ORDER_SUBMITTED = "CHANGE_ORDER_SUBMITTED", "Change Order Submitted"
        CHANGE_ORDER_APPROVED = "CHANGE_ORDER_APPROVED", "Change Order Approved"
        CHANGE_ORDER_REJECTED = "CO_REJECTED", "Change Order Rejected"
        PHOTO_UPLOADED = "PHOTO_UPLOADED", "Photo Uploaded"
        MILESTONE_APPROVED = "MILESTONE_APPROVED", "Milestone Approved"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="events",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="project_events",
    )
    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
    )

    payload = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "project_events"
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["project", "event_type", "created_at"]),
        ] + (
            [GinIndex(fields=["payload"], name="projectevent_payload_gin")]
            if GinIndex
            and "django.contrib.postgres" in getattr(settings, "INSTALLED_APPS", [])
            else []
        )

    def __str__(self):
        return f"{self.event_type} on {self.project.name} by {self.actor.email}"


class ProjectMember(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="members",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )

    class Roles(models.TextChoices):
        CLIENT = "CLIENT", "Client"
        AGENT = "AGENT", "Agent"
        SITE_OFFICER = "SITE_OFFICER", "Site Officer"

    role = models.CharField(
        max_length=20,
        choices=Roles.choices,
        db_index=True,
    )
    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_frozen = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Temporarily suspend member access without permanent removal.",
    )

    class Meta:
        db_table = "project_members"
        unique_together = ["project", "user"]

    def __str__(self):
        return f"{self.user.email} - {self.role} on {self.project.name}"


class Milestone(models.Model):
    class Status(models.TextChoices):
        NOT_STARTED = "NOT_STARTED", "Not Started"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Approval"
        APPROVED = "APPROVED", "Approved"

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="milestones",
    )
    name = models.CharField(max_length=255)
    due_date = models.DateField()
    completion_date = models.DateField(null=True, blank=True)

    payment_amount = models.DecimalField(
        max_digits=15, decimal_places=2, default=Decimal("0.00")
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_milestones",
    )
    approval_token = models.UUIDField(
        default=uuid.uuid4,
        unique=True,
    )

    class Meta:
        db_table = "milestones"
        ordering = ["due_date"]
        indexes = [
            models.Index(fields=["project", "status"]),
        ]

    def __str__(self):
        return f"{self.name} - {self.project.name}"


class IdempotencyRecord(models.Model):
    key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Client-generated UUID v4 idempotency key",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="idempotency_records",
        null=True,
        blank=True,
    )
    endpoint = models.CharField(
        max_length=255,
        help_text="API endpoint path",
    )
    request_hash = models.CharField(
        max_length=64,
        help_text="SHA-256 hash of the request body for debugging",
    )
    response_status = models.IntegerField(
        help_text="HTTP status code of the cached response",
    )
    response_body = models.JSONField(
        help_text="Serialized response data",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "idempotency_records"
        indexes = [
            models.Index(fields=["key", "user"]),
            models.Index(fields=["created_at"]),  # For TTL cleanup
        ]
        verbose_name = "Idempotency Record"
        verbose_name_plural = "Idempotency Records"

    def __str__(self):
        return f"Idempotency: {self.key[:16]}... → {self.endpoint} ({self.response_status})"
