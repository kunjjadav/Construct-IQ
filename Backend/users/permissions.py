from rest_framework.permissions import BasePermission


class IsRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed_roles = getattr(view, "allowed_roles", [])
        if not allowed_roles:
            return True
        return request.user.role in allowed_roles


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsAgent(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "AGENT"
        )


class IsSiteOfficer(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == "SITE_OFFICER"
        )


class IsAgentOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ("AGENT", "ADMIN")
        )
