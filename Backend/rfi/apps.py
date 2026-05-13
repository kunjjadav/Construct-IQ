from django.apps import AppConfig


class RfiConfig(AppConfig):
    name = "rfi"

    def ready(self):
        import rfi.signals  # noqa: F401 — activates post_save signal handlers
