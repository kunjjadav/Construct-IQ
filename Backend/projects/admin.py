from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Project, ProjectEvent, ProjectMember, Milestone
from rfi.models import RFI
from change_orders.models import ChangeOrder
from documents.models import Document


ROLE_COLORS = {
    "ADMIN": "#dc3545",
    "CLIENT": "#007bff",
    "AGENT": "#28a745",
    "SITE_OFFICER": "#fd7e14",
}

PROJECT_STATUS_COLORS = {
    "PLANNING": "#17a2b8",
    "ACTIVE": "#28a745",
    "ON_HOLD": "#ffc107",
    "COMPLETED": "#6610f2",
    "ARCHIVED": "#6c757d",
}

MILESTONE_STATUS_COLORS = {
    "NOT_STARTED": "#6c757d",
    "IN_PROGRESS": "#fd7e14",
    "PENDING_APPROVAL": "#ffc107",
    "APPROVED": "#28a745",
}

CO_STATUS_COLORS = {
    "DRAFT": "#6c757d",
    "PENDING": "#ffc107",
    "APPROVED": "#28a745",
    "REJECTED": "#dc3545",
}

RFI_STATUS_COLORS = {
    "OPEN": "#17a2b8",
    "PENDING_RESPONSE": "#ffc107",
    "ANSWERED": "#28a745",
    "CLOSED": "#6c757d",
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


class ProjectMemberInline(admin.TabularInline):
    model = ProjectMember
    extra = 1
    fields = (
        "user",
        "role",
        "role_badge_display",
        "member_email",
        "member_phone",
        "invited_at",
        "accepted_at",
    )
    readonly_fields = (
        "role_badge_display",
        "member_email",
        "member_phone",
        "invited_at",
        "accepted_at",
    )
    autocomplete_fields = ["user"]

    def member_email(self, obj):
        return obj.user.email if obj.user else "-"

    member_email.short_description = "User Email"

    def member_phone(self, obj):
        return obj.user.phone if obj.user and obj.user.phone else "—"

    member_phone.short_description = "Phone"

    def role_badge_display(self, obj):
        color = ROLE_COLORS.get(obj.role, "#6c757d")
        return render_badge(obj.get_role_display(), color, "10px")

    role_badge_display.short_description = "Role Badge"


class MilestoneInline(admin.TabularInline):
    model = Milestone
    extra = 0
    fields = (
        "name",
        "status_badge",
        "due_date",
        "payment_amount",
        "approved_by",
        "completion_date",
    )
    readonly_fields = ("status_badge", "approved_by", "completion_date")

    def status_badge(self, obj):
        color = MILESTONE_STATUS_COLORS.get(obj.status, "#6c757d")
        return render_badge(obj.get_status_display(), color, "10px")

    status_badge.short_description = "Status"


class ChangeOrderInline(admin.TabularInline):
    model = ChangeOrder
    extra = 0
    fields = ("title", "status_badge", "cost_display", "created_by", "created_at")
    readonly_fields = ("status_badge", "cost_display", "created_at")
    can_delete = False

    def status_badge(self, obj):
        color = CO_STATUS_COLORS.get(obj.status, "#6c757d")
        return render_badge(obj.get_status_display(), color, "10px")

    status_badge.short_description = "Status"

    def cost_display(self, obj):
        return format_html("<strong>${:,.2f}</strong>", obj.cost_impact)

    cost_display.short_description = "Cost Impact"


class RFIInline(admin.TabularInline):
    model = RFI
    extra = 0
    fields = ("title", "status_badge", "submitted_by", "assigned_to", "due_date")
    readonly_fields = ("status_badge", "submitted_by", "created_at")

    def status_badge(self, obj):
        color = RFI_STATUS_COLORS.get(obj.status, "#6c757d")
        return render_badge(obj.get_status_display(), color, "10px")

    status_badge.short_description = "Status"


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0
    fields = (
        "title",
        "version",
        "file_type",
        "uploaded_by",
        "is_current",
        "created_at",
    )
    readonly_fields = ("version", "uploaded_by", "created_at")
    ordering = ("-created_at",)


class ProjectEventInline(admin.TabularInline):
    model = ProjectEvent
    extra = 0
    max_num = 15
    fields = ("event_type", "actor", "created_at", "payload")
    readonly_fields = ("event_type", "actor", "created_at", "payload")
    ordering = ("-created_at",)

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "status_badge",
        "budget_display",
        "completion_bar",
        "team_count",
        "created_by",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("name", "address", "created_by__email")
    ordering = ("-created_at",)
    list_per_page = 25

    fieldsets = (
        (
            "Project Information",
            {"fields": ("name", "address", "status", "created_by")},
        ),
        (
            "Budget & Progress",
            {
                "fields": (
                    "budget_total",
                    "budget_spent",
                    "completion_pct",
                    "financial_control_log",
                ),
                "description": "Budget modifications require formal Change Orders. "
                "Completion % is auto-calculated from milestones.",
            },
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )
    readonly_fields = (
        "created_at",
        "updated_at",
        "budget_spent",
        "completion_pct",
        "financial_control_log",
    )

    inlines = [
        ProjectMemberInline,
        MilestoneInline,
        ChangeOrderInline,
        RFIInline,
        DocumentInline,
        ProjectEventInline,
    ]

    def get_queryset(self, request):

        qs = super().get_queryset(request)
        return qs.annotate(_team_count=Count("members"))

    def financial_control_log(self, obj):

        approved_cos = (
            obj.change_orders.filter(status="APPROVED").aggregate(Sum("cost_impact"))[
                "cost_impact__sum"
            ]
            or 0
        )
        original = obj.budget_total
        adjusted = original + approved_cos
        spent = obj.budget_spent
        remaining = adjusted - spent
        burn_rate = (spent / adjusted * 100) if adjusted > 0 else 0

        return format_html(
            '<div style="background: #f8f9fa; padding: 15px; border-left: 5px solid #007bff; border-radius: 4px;">'
            '<p style="margin: 0 0 8px;"><strong>Original Budget:</strong> ${:,.2f}</p>'
            '<p style="margin: 0 0 8px;"><strong>Approved scope increase:</strong> <span style="color:#28a745">+${:,.2f}</span></p>'
            '<p style="margin: 0 0 10px; font-size: 1.1em;"><strong>Adjusted CapEx:</strong> ${:,.2f}</p>'
            '<hr style="border: 0; border-top: 1px solid #dee2e6; margin: 10px 0;">'
            '<p style="margin: 4px 0;"><strong>Active Utilization:</strong> ${:,.2f} ({}%)</p>'
            '<p style="margin: 4px 0;"><strong>Remaining Liquidity:</strong> ${:,.2f}</p>'
            "</div>",
            original,
            approved_cos,
            adjusted,
            spent,
            f"{burn_rate:,.1f}",
            remaining,
        )

    financial_control_log.short_description = "Financial Overview"

    def status_badge(self, obj):

        color = PROJECT_STATUS_COLORS.get(obj.status, "#6c757d")
        return render_badge(obj.get_status_display(), color)

    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def budget_display(self, obj):

        spent = f"{obj.budget_spent:,.2f}"
        total = f"{obj.budget_total:,.2f}"
        return format_html("<strong>${}</strong> / ${}", spent, total)

    budget_display.short_description = "Spent / Budget"

    def completion_bar(self, obj):

        pct = float(obj.completion_pct)
        color = "#28a745" if pct >= 75 else "#ffc107" if pct >= 40 else "#dc3545"
        width = str(max(pct, 8))
        pct_str = str(pct)
        return format_html(
            '<div style="width:100px; background:#e9ecef; border-radius:4px; overflow:hidden;">'
            '<div style="width:{}%; background:{}; height:18px; text-align:center; '
            'color:white; font-size:11px; line-height:18px; font-weight:bold;">'
            "{}%</div></div>",
            width,
            color,
            pct_str,
        )

    completion_bar.short_description = "Progress"

    def team_count(self, obj):
        count = getattr(obj, "_team_count", 0)
        return format_html("<strong>{}</strong> members", count)

    team_count.short_description = "Team"
    team_count.admin_order_field = "_team_count"


@admin.register(ProjectMember)
class ProjectMemberAdmin(admin.ModelAdmin):
    list_display = (
        "user_email",
        "role_badge",
        "project_name",
        "project_status",
        "invited_at",
        "accepted_at",
    )
    list_filter = ("role", "project__status")
    search_fields = ("user__email", "project__name")
    autocomplete_fields = ["user", "project"]
    list_per_page = 25

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = "User"
    user_email.admin_order_field = "user__email"

    def project_name(self, obj):
        return obj.project.name

    project_name.short_description = "Project"
    project_name.admin_order_field = "project__name"

    def project_status(self, obj):

        color = PROJECT_STATUS_COLORS.get(obj.project.status, "#6c757d")
        return render_badge(obj.project.get_status_display(), color, "10px")

    project_status.short_description = "Project Status"

    def role_badge(self, obj):

        color = ROLE_COLORS.get(obj.role, "#6c757d")
        return render_badge(obj.get_role_display(), color, "10px")

    role_badge.short_description = "Role"


@admin.register(ProjectEvent)
class ProjectEventAdmin(admin.ModelAdmin):
    list_display = ("project", "event_type", "actor", "created_at")
    list_filter = ("event_type", "project")
    search_fields = ("project__name", "actor__email")
    ordering = ("-created_at",)
    readonly_fields = ("project", "actor", "event_type", "payload", "created_at")
    list_per_page = 50

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False  # Audit logs are read-only


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "project",
        "status_badge",
        "due_date",
        "payment_display",
        "approved_by",
        "completion_date",
    )
    list_filter = ("status", "project")
    search_fields = ("name", "project__name")
    ordering = ("due_date",)
    list_per_page = 25

    def status_badge(self, obj):
        color = MILESTONE_STATUS_COLORS.get(obj.status, "#6c757d")
        return render_badge(obj.get_status_display(), color, "10px")

    status_badge.short_description = "Status"

    def payment_display(self, obj):
        return format_html("<strong>${:,.2f}</strong>", obj.payment_amount)

    payment_display.short_description = "Payment"
