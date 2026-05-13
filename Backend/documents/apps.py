from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    name = "documents"

    def ready(self):
        import documents.signals  # noqa: F401 — activates post_save signal handlers
