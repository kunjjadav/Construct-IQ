from django.core.mail import send_mail
from django.conf import settings
from .models import Notification


def create_notification(recipient, notification_type, message, action_url=""):
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync

    notification = Notification.objects.create(
        recipient=recipient,
        notification_type=notification_type,
        message=message[:255],
        action_url=action_url,
    )

    channel_layer = get_channel_layer()
    if channel_layer is not None:
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}",
            {
                "type": "send_notification",
                "payload": {
                    "id": notification.id,
                    "type": notification_type,
                    "message": notification.message,
                    "url": notification.action_url,
                    "time": notification.created_at.isoformat(),
                },
            },
        )

    return notification


def send_email_notification(recipient_email, subject, body):
    try:
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient_email],
            fail_silently=True,
        )
    except Exception:
        pass


def notify_and_email(
    recipient,
    notification_type,
    message,
    action_url="",
    email_subject=None,
    email_body=None,
):
    create_notification(recipient, notification_type, message, action_url)

    if email_subject and email_body:
        send_email_notification(recipient.email, email_subject, email_body)
