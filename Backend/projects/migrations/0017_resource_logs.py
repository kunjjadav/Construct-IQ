# Resource logging models — Labor, Machinery, Material logs

import django.core.validators
import django.db.models.deletion
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0016_wbs_fk_completion_expense"),
    ]

    operations = [
        migrations.CreateModel(
            name="LaborResourceLog",
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
                    "skill_level",
                    models.CharField(
                        choices=[
                            ("FOREMAN", "Foreman"),
                            ("CARPENTER", "Carpenter"),
                            ("ELECTRICIAN", "Electrician"),
                            ("PLUMBER", "Plumber"),
                            ("MASON", "Mason"),
                            ("LABORER", "General Laborer"),
                            ("OPERATOR", "Equipment Operator"),
                            ("OTHER", "Other"),
                        ],
                        max_length=20,
                    ),
                ),
                (
                    "headcount",
                    models.PositiveIntegerField(
                        help_text="Number of workers of this skill type"
                    ),
                ),
                (
                    "hours_worked",
                    models.DecimalField(
                        decimal_places=2,
                        help_text="Total hours worked combined (e.g., 2 workers * 8 hours = 16.00)",
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                ("notes", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "progress_entry",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="labor_logs",
                        to="projects.wbsprogressentry",
                    ),
                ),
            ],
            options={
                "verbose_name": "Labor Log",
                "verbose_name_plural": "Labor Logs",
                "db_table": "labor_resource_logs",
            },
        ),
        migrations.CreateModel(
            name="MachineryResourceLog",
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
                    "machinery_type",
                    models.CharField(
                        help_text="e.g., 'Excavator 20T', 'Tower Crane'", max_length=255
                    ),
                ),
                (
                    "hours_used",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=5,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                (
                    "idle_hours",
                    models.DecimalField(
                        decimal_places=2,
                        default=Decimal("0.00"),
                        help_text="Hours the machine was on site but not actively working",
                        max_digits=5,
                    ),
                ),
                ("notes", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "progress_entry",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="machinery_logs",
                        to="projects.wbsprogressentry",
                    ),
                ),
            ],
            options={
                "verbose_name": "Machinery Log",
                "verbose_name_plural": "Machinery Logs",
                "db_table": "machinery_resource_logs",
            },
        ),
        migrations.CreateModel(
            name="MaterialResourceLog",
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
                    "material_name",
                    models.CharField(
                        help_text="e.g., 'Grade 30 Concrete', 'Rebar 12mm'",
                        max_length=255,
                    ),
                ),
                (
                    "quantity_used",
                    models.DecimalField(
                        decimal_places=2,
                        max_digits=12,
                        validators=[
                            django.core.validators.MinValueValidator(Decimal("0.01"))
                        ],
                    ),
                ),
                (
                    "unit_of_measure",
                    models.CharField(
                        help_text="e.g., 'Cubic Meters', 'Tons', 'Pieces'",
                        max_length=50,
                    ),
                ),
                ("notes", models.CharField(blank=True, default="", max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "progress_entry",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="material_logs",
                        to="projects.wbsprogressentry",
                    ),
                ),
            ],
            options={
                "verbose_name": "Material Log",
                "verbose_name_plural": "Material Logs",
                "db_table": "material_resource_logs",
            },
        ),
    ]
