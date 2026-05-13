from celery import shared_task
from django.utils import timezone
from .models import RFI


@shared_task
def check_rfi_sla_breaches():
    from notifications.services import create_notification
    from projects.models import ProjectMember

    today = timezone.localdate()
    overdue_rfis = RFI.objects.filter(
        status__in=["OPEN", "PENDING_RESPONSE"], due_date__lt=today
    ).select_related("project")

    breaches_flagged = 0

    for rfi in overdue_rfis:
        if rfi.assigned_to:
            create_notification(
                recipient=rfi.assigned_to,
                notification_type="GENERAL_UPDATE",
                message=f"SLA BREACH: RFI '{rfi.title}' is overdue!",
                action_url=f"/projects/{rfi.project_id}/rfi/{rfi.id}",
            )
        else:
            agents = ProjectMember.objects.filter(
                project=rfi.project, role="AGENT"
            ).select_related("user")

            for agent in agents:
                create_notification(
                    recipient=agent.user,
                    notification_type="GENERAL_UPDATE",
                    message=f"SLA BREACH (Unassigned): RFI '{rfi.title}' is overdue!",
                    action_url=f"/projects/{rfi.project_id}/rfi/{rfi.id}",
                )
        breaches_flagged += 1

    return f"Flagged {breaches_flagged} RFI SLA breaches."
