import json
import hashlib
import logging

from django.http import JsonResponse
from django.db import IntegrityError

logger = logging.getLogger(__name__)

IDEMPOTENT_URL_PATTERNS = [
    "/api/milestones/",
    "/api/change-orders/",
    "/api/projects/",
]

IDEMPOTENT_METHODS = {"POST", "PUT", "PATCH"}

IDEMPOTENCY_TTL_HOURS = 24


class IdempotencyMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method not in IDEMPOTENT_METHODS:
            return self.get_response(request)

        if not self._is_financial_endpoint(request.path):
            return self.get_response(request)

        idempotency_key = request.META.get("HTTP_IDEMPOTENCY_KEY", "").strip()

        if not idempotency_key:
            return self.get_response(request)

        if len(idempotency_key) > 64:
            return JsonResponse(
                {"detail": "Idempotency-Key header must be 64 characters or fewer."},
                status=400,
            )

        from projects.models import IdempotencyRecord

        try:
            existing = IdempotencyRecord.objects.get(
                key=idempotency_key,
                user=request.user if request.user.is_authenticated else None,
            )

            logger.info(
                "Idempotency hit: key=%s, endpoint=%s, user=%s",
                idempotency_key,
                request.path,
                request.user.id if request.user.is_authenticated else "anon",
            )

            return JsonResponse(
                existing.response_body,
                status=existing.response_status,
            )

        except IdempotencyRecord.DoesNotExist:
            pass
        except Exception:
            pass

        response = self.get_response(request)

        if request.user.is_authenticated and idempotency_key:
            try:
                if hasattr(response, "data"):
                    response_body = response.data
                elif hasattr(response, "content"):
                    try:
                        response_body = json.loads(response.content.decode("utf-8"))
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        response_body = {"detail": "Response cached (non-JSON)"}
                else:
                    response_body = {"detail": "Response cached"}

                request_hash = hashlib.sha256(
                    f"{request.path}|{request.method}|{request.body.decode('utf-8', errors='replace')}".encode()
                ).hexdigest()[:32]

                IdempotencyRecord.objects.create(
                    key=idempotency_key,
                    user=request.user,
                    endpoint=request.path[:255],
                    request_hash=request_hash,
                    response_status=response.status_code,
                    response_body=response_body,
                )

                logger.info(
                    "Idempotency stored: key=%s, endpoint=%s, status=%s",
                    idempotency_key,
                    request.path,
                    response.status_code,
                )

            except IntegrityError:
                logger.warning(
                    "Idempotency race: key=%s already exists", idempotency_key
                )
            except Exception as e:
                logger.error("Idempotency storage failed: %s", e)

        return response

    @staticmethod
    def _is_financial_endpoint(path: str) -> bool:
        return any(pattern in path for pattern in IDEMPOTENT_URL_PATTERNS)
