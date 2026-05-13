from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import RFI


@receiver(post_save, sender=RFI)
def notify_on_rfi_creation(sender, instance, created, **kwargs):
    if not created:
        return

    from projects.models import ProjectMember
    from notifications.services import notify_and_email

    if instance.assigned_to:
        notify_and_email(
            recipient=instance.assigned_to,
            notification_type="RFI_ASSIGNED",
            message=f'New RFI assigned to you: "{instance.title}" on {instance.project.name}',
            action_url=f"/dashboard/rfi/{instance.id}",
            email_subject=f"[ConstructIQ] RFI Assigned: {instance.title}",
            email_body=(
                f"A new Request for Information has been assigned to you.\n\n"
                f"Project: {instance.project.name}\n"
                f"Title: {instance.title}\n"
                f"Description: {instance.description}\n\n"
                f"Please log in to provide your response."
            ),
        )
    else:
        agent_members = ProjectMember.objects.filter(
            project=instance.project,
            role="AGENT",
        ).select_related("user")

        for member in agent_members:
            if member.user == instance.submitted_by:
                continue

            notify_and_email(
                recipient=member.user,
                notification_type="RFI_ASSIGNED",
                message=f'New RFI: "{instance.title}" on {instance.project.name}',
                action_url=f"/dashboard/rfi/{instance.id}",
                email_subject=f"[ConstructIQ] New RFI: {instance.title}",
                email_body=(
                    f"A new Request for Information has been raised.\n\n"
                    f"Project: {instance.project.name}\n"
                    f"Title: {instance.title}\n"
                    f"Description: {instance.description}\n\n"
                    f"Please log in to provide your response."
                ),
            )


@receiver(post_save, sender=RFI)
def notify_on_rfi_answered(sender, instance, created, **kwargs):
    if created or instance.status != "ANSWERED" or not instance.response:
        return

    from notifications.services import notify_and_email
    from django.conf import settings

    requestor = instance.submitted_by
    if not requestor:
        return

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    action_link = f"{frontend_url}/rfi/{instance.id}"

    notify_and_email(
        recipient=requestor,
        notification_type="SYSTEM_ALERT",
        message=f'RFI Answered: "{instance.title}" on {instance.project.name}',
        action_url=f"/rfi/{instance.id}",
        email_subject=f"RFI Answered: '{instance.title}'",
        email_body=(
            f"Hello,\n\n"
            f"Your Request for Information (RFI) on project '{instance.project.name}' has been answered.\n\n"
            f"Question:\n{instance.description}\n\n"
            f"Answer:\n{instance.response}\n\n"
            f"View the full record:\n{action_link}\n\n"
            f"Thank you,\n"
            f"The ConstructIQ Team"
        ),
    )
