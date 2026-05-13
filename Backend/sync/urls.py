from django.urls import path
from .views import SyncStatusView, OfflineBatchSyncView

app_name = "sync"

urlpatterns = [
    path("status/", SyncStatusView.as_view(), name="sync-status"),
    path("offline-batch/", OfflineBatchSyncView.as_view(), name="sync-offline-batch"),
]
