from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document


@receiver(post_save, sender=Document)
def log_document_upload_event(sender, instance, created, **kwargs):
    if not created:
        return

    from projects.models import ProjectEvent

    ProjectEvent.objects.create(
        project=instance.project,
        event_type="DOCUMENT_UPLOADED",
        actor=instance.uploaded_by,
        payload={
            "document_id": instance.id,
            "title": instance.title,
            "version": instance.version,
            "file_type": instance.file_type,
            "checksum": instance.checksum,
        },
    )
