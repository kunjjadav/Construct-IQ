from urllib.parse import parse_qs
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from jwt import decode as jwt_decode
from django.conf import settings


@database_sync_to_async
def get_user(token_key):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    try:
        from rest_framework_simplejwt.tokens import UntypedToken
        from django.contrib.auth.models import AnonymousUser

        UntypedToken(token_key)
        decoded_data = jwt_decode(token_key, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded_data.get("user_id")
        return User.objects.get(id=user_id)
    except Exception:
        from django.contrib.auth.models import AnonymousUser

        return AnonymousUser()


class JWTAuthMiddleware:
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        from http.cookies import SimpleCookie
        from django.contrib.auth.models import AnonymousUser

        token = None
        headers = dict(scope.get("headers", []))
        if b"cookie" in headers:
            cookie = SimpleCookie(headers[b"cookie"].decode())
            if "access" in cookie:
                token = cookie["access"].value

        if not token:
            query_string = scope.get("query_string", b"").decode()
            query_params = parse_qs(query_string)
            token = query_params.get("token", [None])[0]

        if token:
            scope["user"] = await get_user(token)
        else:
            scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
