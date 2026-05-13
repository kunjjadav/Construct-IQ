from django.apps import AppConfig


class PhotosConfig(AppConfig):
    name = "photos"

    def ready(self):
        import photos.signals  # noqa: F401 — activates post_save signal handlers
