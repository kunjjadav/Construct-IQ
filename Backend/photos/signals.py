from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Photo


@receiver(post_save, sender=Photo)
def log_photo_upload_event(sender, instance, created, **kwargs):
    if not created:
        return

    from projects.models import ProjectEvent

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="PHOTO_UPLOADED",
        actor=instance.uploaded_by,
        payload={
            "photo_id": instance.id,
            "caption": instance.caption,
            "lat": str(instance.lat) if instance.lat else None,
            "lon": str(instance.lon) if instance.lon else None,
        },
    )
