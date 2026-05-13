from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class Photo(models.Model):
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="photos",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="uploaded_photos",
    )

    s3_key = models.CharField(max_length=500, blank=True, default="")
    thumbnail_key = models.CharField(max_length=500, blank=True, default="")

    lat = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("-90.0")),
            MaxValueValidator(Decimal("90.0")),
        ],
    )
    lon = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(Decimal("-180.0")),
            MaxValueValidator(Decimal("180.0")),
        ],
    )

    taken_at = models.DateTimeField(null=True, blank=True)
    caption = models.CharField(max_length=500, blank=True, default="")

    linked_rfi = models.ForeignKey(
        "rfi.RFI",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="photos",
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "photos"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Photo #{self.pk} - {self.project.name}"


class WeeklyLog(models.Model):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        SUBMITTED = "SUBMITTED", "Submitted"

    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.CASCADE,
        related_name="weekly_logs",
    )
    site_officer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="weekly_logs",
    )

    week_start_date = models.DateField(db_index=True)
    weather = models.CharField(max_length=50, blank=True, default="")
    crew_count = models.PositiveIntegerField(default=0)

    budget_used = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Budget consumed this week",
    )

    notes = models.TextField(
        blank=True,
        default="",
        help_text="Summary of the week's accomplishments and blockers.",
    )

    attached_photos = models.ManyToManyField(
        "Photo", blank=True, related_name="weekly_logs"
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
    )

    pdf_s3_key = models.CharField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "weekly_logs"
        ordering = ["-week_start_date"]
        unique_together = ["project", "site_officer", "week_start_date"]

    def __str__(self):
        return f"Week of {self.week_start_date} - {self.project.name}"
