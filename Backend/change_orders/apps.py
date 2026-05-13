from django.apps import AppConfig


class ChangeOrdersConfig(AppConfig):
    name = "change_orders"

    def ready(self):
        import change_orders.signals  # noqa: F401 — activates post_save signal handlers
