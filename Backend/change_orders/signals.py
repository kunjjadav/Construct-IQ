from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChangeOrder


@receiver(post_save, sender=ChangeOrder)
def notify_on_change_order_creation(sender, instance, created, **kwargs):
    if not created:
        return

    from projects.models import ProjectMember
    from notifications.services import notify_and_email

    client_members = ProjectMember.objects.filter(
        project=instance.project,
        role="CLIENT",
    ).select_related("user")

    for member in client_members:
        notify_and_email(
            recipient=member.user,
            notification_type="CO_PENDING",
            message=f'New Change Order: "{instance.title}" (${instance.cost_impact}) on {instance.project.name}',
            action_url=f"/dashboard/change-orders/{instance.id}/review",
            email_subject=f"[ConstructIQ] New Change Order: {instance.title}",
            email_body=(
                f'A new Change Order has been submitted for project "{instance.project.name}".\n\n'
                f"Title: {instance.title}\n"
                f"Cost Impact: ${instance.cost_impact}\n"
                f"Schedule Impact: {instance.schedule_impact_days} days\n\n"
                f"Please log in to review."
            ),
        )


@receiver(post_save, sender=ChangeOrder)
def notify_clients_on_co_pending_approval(sender, instance, **kwargs):
    if instance.status != "PENDING":
        return

    from projects.models import ProjectMember
    from notifications.services import notify_and_email
    from django.conf import settings

    clients = ProjectMember.objects.filter(
        project=instance.project, role="CLIENT"
    ).select_related("user")

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    magic_action_link = f"{frontend_url}/change-orders/{instance.id}/review?token={instance.approval_token}"

    for client in clients:
        notify_and_email(
            recipient=client.user,
            notification_type="SYSTEM_ALERT",
            message=f"Change Order Ready for Approval: {instance.title}",
            action_url=f"/change-orders/{instance.id}",
            email_subject=f"Approval Required: Change Order '{instance.title}'",
            email_body=(
                f"Hello,\n\n"
                f"A new Change Order '{instance.title}' on your project '{instance.project.name}' is now pending your approval.\n\n"
                f"Cost Impact: ${instance.cost_impact:,.2f}\n"
                f"Schedule Impact: {instance.schedule_impact_days} days\n\n"
                f"Click the link below to review and approve this scope change.\n\n"
                f"> {magic_action_link} <\n\n"
                f"Thank you,\n"
                f"The ConstructIQ Team"
            ),
        )


@receiver(post_save, sender=ChangeOrder)
def log_co_approved_event(sender, instance, created, **kwargs):
    if created or instance.status != "APPROVED":
        return

    from projects.models import ProjectEvent

    if ProjectEvent.objects.filter(
        project=instance.project,
        event_type="CHANGE_ORDER_APPROVED",
        payload__contains={"change_order_id": instance.id},
    ).exists():
        return

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="CHANGE_ORDER_APPROVED",
        actor=instance.approved_by or instance.created_by,
        payload={
            "change_order_id": instance.id,
            "title": instance.title,
            "cost_impact": str(instance.cost_impact),
            "approved_by_email": instance.approved_by.email
            if instance.approved_by
            else None,
            "signature_hash": getattr(instance, "signature_hash", None),
        },
    )


@receiver(post_save, sender=ChangeOrder)
def log_co_rejected_event(sender, instance, created, **kwargs):
    if created or instance.status != "REJECTED":
        return

    from projects.models import ProjectEvent

    if ProjectEvent.objects.filter(
        project=instance.project,
        event_type="CO_REJECTED",
        payload__contains={"change_order_id": instance.id},
    ).exists():
        return

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="CO_REJECTED",
        actor=instance.approved_by or instance.created_by,
        payload={
            "change_order_id": instance.id,
            "title": instance.title,
            "cost_impact": str(instance.cost_impact),
            "rejected_by_email": instance.approved_by.email
            if instance.approved_by
            else None,
        },
    )
