import os
from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("constructiq")
app.config_from_object("django.conf:settings", namespace="CELERY")

from celery.schedules import crontab  # noqa: E402

app.autodiscover_tasks()

app.conf.beat_schedule = {
    "daily-log-reminders": {
        "task": "photos.tasks.send_daily_log_reminders",
        "schedule": crontab(hour=16, minute=0),
    },
    "rfi-sla-breach-check": {
        "task": "rfi.tasks.check_rfi_sla_breaches",
        "schedule": crontab(minute=0),
    },
}
