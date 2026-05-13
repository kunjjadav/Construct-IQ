import logging
from django.db import connection

logger = logging.getLogger(__name__)


class RLSContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self._is_postgres = connection.vendor == "postgresql"

    def __call__(self, request):
        if (
            self._is_postgres
            and hasattr(request, "user")
            and request.user.is_authenticated
        ):
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT set_config('app.current_user_id', %s, false)",
                        [str(request.user.id)],
                    )
                    cursor.execute(
                        "SELECT set_config('app.current_user_role', %s, false)",
                        [getattr(request.user, "role", "CLIENT")],
                    )
            except Exception as e:
                logger.warning("RLS context injection failed: %s", e)

        response = self.get_response(request)

        if self._is_postgres:
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SELECT set_config('app.current_user_id', '', false)"
                    )
                    cursor.execute(
                        "SELECT set_config('app.current_user_role', '', false)"
                    )
            except Exception as e:
                logger.warning("RLS context cleanup failed: %s", e)

        return response
