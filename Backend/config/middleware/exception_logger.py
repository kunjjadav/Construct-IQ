import logging
import traceback
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger("django.request")


class ExceptionLoggingMiddleware(MiddlewareMixin):
    def process_exception(self, request, exception):
        logger.error(
            "Unhandled exception on %s: %s",
            request.path,
            traceback.format_exc(),
        )
        return None
