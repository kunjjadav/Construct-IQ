from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from rest_framework.exceptions import PermissionDenied
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers

from projects.models import ProjectEvent, ProjectMember
from photos.serializers import WeeklyLogSerializer
from rfi.serializers import RFISerializer


class SyncStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["Offline Sync"],
        responses={
            200: inline_serializer(
                "SyncStatusResponse",
                fields={
                    "latest_event_id": serializers.IntegerField(),
                    "timestamp": serializers.DateTimeField(),
                },
            )
        },
    )
    def get(self, request):
        latest_event = ProjectEvent.objects.order_by("-created_at").first()
        return Response(
            {
                "latest_event_id": latest_event.id if latest_event else 0,
                "timestamp": timezone.now().isoformat(),
            }
        )


class OfflineBatchSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=["Offline Sync"],
        request=inline_serializer(
            "OfflineBatchRequest",
            fields={"mutations": serializers.ListField(child=serializers.DictField())},
        ),
        responses={
            200: inline_serializer(
                "OfflineBatchResponse",
                fields={
                    "status": serializers.CharField(),
                    "processed": serializers.IntegerField(),
                    "timestamp": serializers.DateTimeField(),
                },
            )
        },
    )
    def post(self, request):
        mutations = request.data.get("mutations", [])
        if not isinstance(mutations, list):
            return Response(
                {"error": "mutations must be a list"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        processed = 0
        user = request.user

        try:
            with transaction.atomic():
                for mutation in mutations:
                    m_type = mutation.get("type")
                    payload = mutation.get("payload", {})
                    project_id = payload.get("project")

                    if not project_id:
                        raise ValueError("Payload missing 'project' ID.")

                    if user.role not in ("AGENT", "ADMIN"):
                        if not ProjectMember.objects.filter(
                            project_id=project_id, user=user
                        ).exists():
                            raise PermissionDenied(
                                "You do not have access to this project."
                            )

                    if m_type == "CREATE_WEEKLY_LOG":
                        serializer = WeeklyLogSerializer(data=payload)
                        serializer.is_valid(raise_exception=True)
                        serializer.save(site_officer=user)
                        processed += 1

                    elif m_type == "CREATE_RFI":
                        serializer = RFISerializer(data=payload)
                        serializer.is_valid(raise_exception=True)
                        serializer.save(submitted_by=user)
                        processed += 1

                    else:
                        raise ValueError(f"Unknown mutation type: {m_type}")

        except PermissionDenied as e:
            raise e
        except Exception as e:
            return Response(
                {"error": str(e), "processed_before_failure": processed},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "status": "success",
                "processed": processed,
                "timestamp": timezone.now().isoformat(),
            },
            status=status.HTTP_200_OK,
        )
