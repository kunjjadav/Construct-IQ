from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from .models import Project, ProjectEvent, ProjectMember, Milestone


@receiver(post_save, sender=Project)
def log_project_creation_or_update(sender, instance, created, **kwargs):
    event_type = "CREATED" if created else "UPDATED"

    payload = {
        "name": instance.name,
        "status": instance.status,
        "address": instance.address,
    }

    executor = getattr(instance, "created_by", None)

    ProjectEvent.objects.create(
        project=instance, event_type=event_type, actor=executor, payload=payload
    )


@receiver(post_save, sender="projects.Milestone")
def notify_clients_on_milestone_pending_approval(sender, instance, **kwargs):
    if instance.status != "PENDING_APPROVAL":
        return

    from projects.models import ProjectMember
    from notifications.services import notify_and_email
    from django.conf import settings

    clients = ProjectMember.objects.filter(
        project=instance.project, role="CLIENT"
    ).select_related("user")

    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000")
    magic_action_link = f"{frontend_url}/milestones/{instance.id}/review?token={instance.approval_token}"

    for client in clients:
        notify_and_email(
            recipient=client.user,
            notification_type="SYSTEM_ALERT",
            message=f"Milestone Ready for Approval: {instance.name} on {instance.project.name}",
            action_url=f"/milestones/{instance.id}",
            email_subject=f"Approval Required: Milestone '{instance.name}'",
            email_body=(
                f"Hello,\n\n"
                f"The milestone '{instance.name}' on your project '{instance.project.name}' is now pending your approval.\n\n"
                f"Payment Amount: ${instance.payment_amount:,.2f}\n"
                f"Due Date: {instance.due_date}\n\n"
                f"Click the secure link below to review and digitally approve this milestone.\n\n"
                f"> {magic_action_link} <\n\n"
                f"Thank you,\n"
                f"The ConstructIQ Team"
            ),
        )


@receiver(post_save, sender=ProjectMember)
def log_member_added_event(sender, instance, created, **kwargs):
    if not created:
        return

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="MEMBER_ADDED",
        actor=instance.user,
        payload={
            "member_user_id": instance.user.id,
            "member_email": instance.user.email,
            "role": instance.role,
        },
    )


@receiver(post_save, sender=Milestone)
def log_milestone_approved_event(sender, instance, created, **kwargs):
    if created or instance.status != "APPROVED":
        return

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="MILESTONE_APPROVED",
        actor=instance.approved_by,
        payload={
            "milestone_id": instance.id,
            "milestone_name": instance.name,
            "payment_amount": str(instance.payment_amount),
            "approved_by_email": instance.approved_by.email
            if instance.approved_by
            else None,
        },
    )


@receiver(pre_delete, sender=ProjectMember)
def log_member_removed_event(sender, instance, **kwargs):
    user = instance.user
    project = instance.project
    role = instance.role

    ProjectEvent.objects.create(
        project=project,
        event_type="MEMBER_REMOVED",
        actor=project.created_by,
        payload={
            "removed_user_id": user.id,
            "removed_email": user.email,
            "role": role,
            "reason": "Admin action via Django Admin panel",
        },
    )

    try:
        from notifications.services import notify_and_email

        notify_and_email(
            recipient=user,
            notification_type="SYSTEM_ALERT",
            message=f"Your access to project '{project.name}' has been revoked.",
            action_url="/projects",
            email_subject=f"Access Revoked: {project.name}",
            email_body=(
                f"Hello,\n\n"
                f"Your assignment as {instance.get_role_display()} on the project "
                f"'{project.name}' has been removed by the project administrator.\n\n"
                f"If you believe this is an error, please contact your project manager immediately.\n\n"
                f"Thank you,\n"
                f"The ConstructIQ Team"
            ),
        )
    except Exception:
        pass
