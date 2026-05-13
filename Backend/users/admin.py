from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.db.models import Count
from .models import User
from projects.models import ProjectMember


ROLE_COLORS = {
    "CLIENT": "#007bff",
    "AGENT": "#28a745",
    "ADMIN": "#dc3545",
    "SITE_OFFICER": "#fd7e14",
}

PROJECT_STATUS_COLORS = {
    "PLANNING": "#17a2b8",
    "ACTIVE": "#28a745",
    "ON_HOLD": "#ffc107",
    "COMPLETED": "#6610f2",
    "ARCHIVED": "#6c757d",
}


def render_badge(label, color, font_size="11px"):
    return format_html(
        '<span style="color: white; background: {}; padding: 3px 10px; '
        "border-radius: 12px; font-size: {}; font-weight: bold; "
        'white-space: nowrap;">{}</span>',
        color,
        font_size,
        label,
    )


from django import forms  # noqa: E402


class UserProjectInlineForm(forms.ModelForm):
    class Meta:
        model = ProjectMember
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        if "role" in self.fields:
            self.fields["role"].required = False


class UserProjectsInline(admin.TabularInline):
    model = ProjectMember
    form = UserProjectInlineForm
    fk_name = "user"
    extra = 1
    autocomplete_fields = ["project"]
    fields = (
        "project",
        "role",
        "project_link",
        "project_status",
        "project_budget",
        "invited_at",
        "accepted_at",
    )
    readonly_fields = (
        "project_link",
        "project_status",
        "project_budget",
        "invited_at",
        "accepted_at",
    )
    verbose_name = "Project Assignment"
    verbose_name_plural = "Project Assignments"

    def project_link(self, obj):
        if obj.project:
            from django.urls import reverse

            url = reverse("admin:projects_project_change", args=[obj.project.id])
            return format_html(
                '<a href="{}" style="font-weight:bold;">{}</a>', url, obj.project.name
            )
        return "—"

    project_link.short_description = "Project (Link)"

    def project_status(self, obj):
        if not obj.project:
            return "—"
        color = PROJECT_STATUS_COLORS.get(obj.project.status, "#6c757d")
        return render_badge(obj.project.get_status_display(), color, "10px")

    project_status.short_description = "Project Status"

    def project_budget(self, obj):
        if obj.project:
            budget_str = f"{obj.project.budget_total:,.2f}"
            return format_html("${}", budget_str)
        return "—"

    project_budget.short_description = "Budget"

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        formset._parent_user = obj
        return formset


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "email",
        "role_badge",
        "phone",
        "project_count",
        "is_active",
        "date_joined",
    )
    list_filter = ("role", "is_active", "is_staff")
    search_fields = ("email", "phone")
    ordering = ("-date_joined",)
    list_per_page = 25

    fieldsets = (
        ("Authentication", {"fields": ("email", "password")}),
        (
            "Role & Profile",
            {
                "fields": ("role", "phone"),
                "description": "The role determines what this user can see and do across the platform.",
            },
        ),
        (
            "Magic Link Authentication",
            {
                "fields": ("magic_token", "token_expiry"),
                "classes": ("collapse",),
            },
        ),
        (
            "Permissions",
            {
                "fields": ("is_active", "is_staff", "is_superuser"),
            },
        ),
        (
            "Important Dates",
            {
                "fields": ("date_joined",),
                "classes": ("collapse",),
            },
        ),
    )

    inlines = [UserProjectsInline]

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "role", "phone", "password1", "password2"),
            },
        ),
    )

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(_project_count=Count("project_memberships"))

    def role_badge(self, obj):
        color = ROLE_COLORS.get(obj.role, "#6c757d")
        return render_badge(obj.get_role_display(), color)

    role_badge.short_description = "Role"
    role_badge.admin_order_field = "role"

    def project_count(self, obj):
        count = getattr(obj, "_project_count", 0)
        if count == 0:
            return mark_safe('<span style="color:#6c757d;">No projects</span>')
        return format_html(
            "<strong>{}</strong> project{}", count, "s" if count != 1 else ""
        )

    project_count.short_description = "Projects"
    project_count.admin_order_field = "_project_count"

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)

        parent_user = getattr(formset, "_parent_user", None)

        for instance in instances:
            if not instance.pk and parent_user:
                role_map = {
                    "CLIENT": "CLIENT",
                    "AGENT": "AGENT",
                    "SITE_OFFICER": "SITE_OFFICER",
                    "ADMIN": "AGENT",
                }
                instance.role = role_map.get(parent_user.role, instance.role)
            instance.save()

        for obj in formset.deleted_objects:
            obj.delete()

        formset.save_m2m()
