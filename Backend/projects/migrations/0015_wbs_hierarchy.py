# WBS Hierarchy models — WBSNode, WBSProgressEntry, DailyProgressSnapshot

import django.core.validators
import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0014_completionrequest"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # MODEL 1: WBSNode — Hierarchical tree node
        migrations.CreateModel(
            name="WBSNode",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "path",
                    models.CharField(
                        db_index=True,
                        help_text='Materialized path (e.g., "1.2.3") for fast subtree queries.',
                        max_length=255,
                    ),
                ),
                (
                    "depth",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="0-indexed depth in the tree. 0=Phase, 1=Sub-Phase, etc.",
                    ),
                ),
                (
                    "sort_order",
                    models.PositiveIntegerField(
                        default=0, help_text="Sort position among siblings."
                    ),
                ),
                (
                    "wbs_code",
                    models.CharField(
                        db_index=True,
                        help_text='WBS code identifier (e.g., "1.0", "1.2.3", "3.4.1.2").',
                        max_length=50,
                    ),
                ),
                ("title", models.CharField(max_length=500)),
                ("description", models.TextField(blank=True, default="")),
                (
                    "node_type",
                    models.CharField(
                        choices=[
                            ("PHASE", "Phase"),
                            ("SUB_PHASE", "Sub-Phase"),
                            ("WORK_PACKAGE", "Work Package"),
                            ("ACTIVITY", "Activity"),
                        ],
                        default="ACTIVITY",
                        max_length=20,
                    ),
                ),
                (
                    "is_leaf",
                    models.BooleanField(
                        default=True,
                        help_text="True if this node has no children. Only leaf nodes accept progress.",
                    ),
                ),
                (
                    "budget_weight",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("0.0000"),
                        help_text="Percentage of TOTAL project budget this node represents.",
                        max_digits=8,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.0000")),
                            django.core.validators.MaxValueValidator(
                                Decimal("100.0000")
                            ),
                        ],
                    ),
                ),
                (
                    "estimated_cost",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Estimated cost for this WBS node.",
                        max_digits=15,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.00"))
                        ],
                    ),
                ),
                ("planned_start", models.DateField(blank=True, null=True)),
                ("planned_end", models.DateField(blank=True, null=True)),
                ("actual_start", models.DateField(blank=True, null=True)),
                ("actual_end", models.DateField(blank=True, null=True)),
                (
                    "rule_of_credit",
                    models.CharField(
                        choices=[
                            ("0/100", "0/100 Rule (Binary: 0% or 100%)"),
                            ("50/50", "50/50 Rule (50% at start, 100% at finish)"),
                            ("PERCENT", "Manual Percentage"),
                            ("UNITS", "Units Completed (Quantity-based)"),
                            ("MILESTONE", "Incremental Milestones"),
                        ],
                        default="PERCENT",
                        help_text="How physical completion is measured for this task.",
                        max_length=20,
                    ),
                ),
                (
                    "total_quantity",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("0.0000"),
                        help_text="Total planned quantity (only for UNITS rule of credit).",
                        max_digits=15,
                    ),
                ),
                (
                    "completed_quantity",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("0.0000"),
                        help_text="Completed quantity so far (only for UNITS rule of credit).",
                        max_digits=15,
                    ),
                ),
                (
                    "unit_of_measure",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Unit of measure (cubic meters, tons, sq ft, etc.).",
                        max_length=50,
                    ),
                ),
                (
                    "milestone_definitions",
                    models.JSONField(
                        blank=True,
                        default=list,
                        help_text="Milestone steps with cumulative percentages (for MILESTONE rule of credit).",
                    ),
                ),
                (
                    "completion_pct",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Current completion percentage of this node.",
                        max_digits=6,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.00")),
                            django.core.validators.MaxValueValidator(Decimal("100.00")),
                        ],
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("NOT_STARTED", "Not Started"),
                            ("IN_PROGRESS", "In Progress"),
                            ("COMPLETED", "Completed"),
                            ("ON_HOLD", "On Hold"),
                        ],
                        db_index=True,
                        default="NOT_STARTED",
                        max_length=20,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "parent",
                    models.ForeignKey(
                        blank=True,
                        help_text="Parent node in the WBS hierarchy. NULL = root/phase level.",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="children",
                        to="projects.wbsnode",
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="wbs_nodes",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "WBS Node",
                "verbose_name_plural": "WBS Nodes",
                "db_table": "wbs_nodes",
                "ordering": ["path", "sort_order"],
                "unique_together": {("project", "wbs_code")},
                "indexes": [
                    models.Index(
                        fields=["project", "parent"],
                        name="wbs_nodes_project_parent_idx",
                    ),
                    models.Index(
                        fields=["project", "is_leaf", "status"],
                        name="wbs_nodes_leaf_status_idx",
                    ),
                    models.Index(
                        fields=["project", "depth"], name="wbs_nodes_project_depth_idx"
                    ),
                ],
            },
        ),
        # MODEL 2: WBSProgressEntry — Daily progress audit
        migrations.CreateModel(
            name="WBSProgressEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "previous_pct",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Task completion % before this update.",
                        max_digits=6,
                    ),
                ),
                (
                    "new_pct",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Task completion % after this update.",
                        max_digits=6,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.00")),
                            django.core.validators.MaxValueValidator(Decimal("100.00")),
                        ],
                    ),
                ),
                (
                    "delta_pct",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Computed: new_pct - previous_pct.",
                        max_digits=6,
                    ),
                ),
                (
                    "description",
                    models.TextField(
                        blank=True,
                        default="",
                        help_text="What physical work was performed.",
                    ),
                ),
                ("log_date", models.DateField(help_text="Date of the physical work.")),
                (
                    "quantity_delta",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("0.0000"),
                        help_text="Quantity completed in this entry (for UNITS rule).",
                        max_digits=15,
                    ),
                ),
                (
                    "milestone_reached",
                    models.CharField(
                        blank=True,
                        default="",
                        help_text="Name of milestone reached (for MILESTONE rule).",
                        max_length=255,
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "reported_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="wbs_progress_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "wbs_node",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progress_entries",
                        to="projects.wbsnode",
                    ),
                ),
            ],
            options={
                "verbose_name": "WBS Progress Entry",
                "verbose_name_plural": "WBS Progress Entries",
                "db_table": "wbs_progress_entries",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(
                        fields=["wbs_node", "-log_date"],
                        name="wbs_progress_node_date_idx",
                    ),
                    models.Index(
                        fields=["reported_by", "-log_date"],
                        name="wbs_progress_reporter_idx",
                    ),
                    models.Index(fields=["log_date"], name="wbs_progress_log_date_idx"),
                ],
            },
        ),
        # MODEL 3: DailyProgressSnapshot — EVM snapshots
        migrations.CreateModel(
            name="DailyProgressSnapshot",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "snapshot_date",
                    models.DateField(help_text="The date this snapshot covers."),
                ),
                (
                    "overall_completion_pct",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Algorithmically computed project completion % on this date.",
                        max_digits=6,
                    ),
                ),
                (
                    "previous_day_pct",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Previous day overall completion % (for delta calculation).",
                        max_digits=6,
                    ),
                ),
                (
                    "delta_pct",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Daily progress delta = today - yesterday.",
                        max_digits=6,
                    ),
                ),
                (
                    "earned_value",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Earned Value (EV) = overall_completion_pct × BAC / 100.",
                        max_digits=15,
                    ),
                ),
                (
                    "planned_value",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Planned Value (PV) from the PV S-curve on this date.",
                        max_digits=15,
                    ),
                ),
                (
                    "actual_cost",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Cumulative Actual Cost (AC) up to this date.",
                        max_digits=15,
                    ),
                ),
                (
                    "cpi",
                    models.DecimalField(
                        blank=True,
                        decimal_places=4,
                        help_text="Cost Performance Index on this date.",
                        max_digits=8,
                        null=True,
                    ),
                ),
                (
                    "spi",
                    models.DecimalField(
                        blank=True,
                        decimal_places=4,
                        help_text="Schedule Performance Index on this date.",
                        max_digits=8,
                        null=True,
                    ),
                ),
                (
                    "tasks_completed_today",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Number of WBS tasks that reached 100% on this date.",
                    ),
                ),
                (
                    "progress_entries_today",
                    models.PositiveIntegerField(
                        default=0,
                        help_text="Number of WBS progress entries logged on this date.",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="daily_snapshots",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "Daily Progress Snapshot",
                "verbose_name_plural": "Daily Progress Snapshots",
                "db_table": "daily_progress_snapshots",
                "ordering": ["-snapshot_date"],
                "unique_together": {("project", "snapshot_date")},
                "indexes": [
                    models.Index(
                        fields=["project", "-snapshot_date"],
                        name="daily_snap_project_date_idx",
                    ),
                ],
            },
        ),
    ]
