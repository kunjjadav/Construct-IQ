# WBS foreign keys — link CompletionRequest and Expense to WBSNode

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0015_wbs_hierarchy"),
    ]

    operations = [
        migrations.AddField(
            model_name="completionrequest",
            name="wbs_node",
            field=models.ForeignKey(
                blank=True,
                help_text="The specific WBS task this completion request is tied to",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="completion_requests",
                to="projects.wbsnode",
            ),
        ),
        migrations.AddField(
            model_name="expense",
            name="wbs_node",
            field=models.ForeignKey(
                blank=True,
                help_text="WBS task this expense is attributed to",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="expenses",
                to="projects.wbsnode",
            ),
        ),
    ]
