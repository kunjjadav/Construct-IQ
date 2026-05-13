import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuthStore } from "../../store/useAuthStore";
import { listLogs, submitLog, exportPdf } from "../../api/weeklyLogs";
import type { WeeklyLogRecord } from "../../api/weeklyLogs";
import { listPhotos } from "../../api/photos";
import type { PhotoRecord } from "../../api/photos";
import { FileText, Send, Loader2, Download, Camera } from "lucide-react";

import FocusView from "../../components/layout/FocusView";
import WeeklyLogForm from "../../components/field/WeeklyLogForm";
import PhotoUpload from "../../components/field/PhotoUpload";

import Button from "../../components/ui/Button";
import { toast } from "../../components/ui/Toast";
import EmptyState from "../../components/ui/EmptyState";
import Card from "../../components/ui/Card";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import Badge from "../../components/ui/Badge";

export default function FieldOpsDashboard() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<WeeklyLogRecord[]>([]);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [isLogFormOpen, setLogFormOpen] = useState(false);
  const [isPhotoFormOpen, setPhotoFormOpen] = useState(false);

  const fetchFieldData = useCallback(async () => {
    if (!currentProject) return;
    setIsLoading(true);
    try {
      const [fetchedLogs, fetchedPhotos] = await Promise.all([
        listLogs(currentProject.id).catch(() => [] as WeeklyLogRecord[]),
        listPhotos(currentProject.id).catch(() => [] as PhotoRecord[]),
      ]);
      setLogs(fetchedLogs);
      setPhotos(fetchedPhotos);
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchFieldData();
  }, [fetchFieldData]);

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Site Assigned"
          description="Please select a project to initialize field operations."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-24 md:pb-12">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-6 sm:pb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Site Control
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1 sm:mt-2 ml-1 text-sm sm:text-lg">
            {currentProject.name} — Execution & Reality Capture
          </p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {(user?.role === "SITE_OFFICER" ||
            user?.role === "AGENT" ||
            user?.role === "ADMIN") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPhotoFormOpen(true)}
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
              Reality Capture
            </Button>
          )}
          {user?.role === "SITE_OFFICER" && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setLogFormOpen(true)}
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
              Submit Weekly Log
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-6 mt-4">
          <SkeletonLoader type="table-row" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[var(--color-accent-cyan)]" />
              Weekly Execution Stream
            </h2>

            <div className="flex flex-col gap-4">
              {logs.length === 0 ? (
                <EmptyState
                  title="No logs yet"
                  description="Start documenting this week's progress."
                />
              ) : (
                logs.map((log) => (
                  <Card
                    key={log.id}
                    variant="surface"
                    padding="md"
                    className="flex flex-col gap-4 transition-all hover:border-[var(--color-border-strong)]"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="font-bold text-lg text-[var(--color-text-primary)]">
                          Week of {log.week_start_date}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)] font-mono uppercase tracking-widest">
                          LOG-{String(log.id).substring(0, 8)}
                        </span>
                      </div>
                      <Badge status={log.status} />
                    </div>

                    <div className="grid grid-cols-3 gap-4 bg-[var(--color-bg-interactive)] p-3 rounded-lg border border-[var(--color-border-subtle)]">
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-bold text-[var(--color-text-muted)]">
                          Crew Count
                        </span>
                        <span className="text-sm font-semibold">
                          {log.crew_count} personnel
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-bold text-[var(--color-text-muted)]">
                          Weather
                        </span>
                        <span className="text-sm font-semibold">
                          {log.weather}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs uppercase font-bold text-[var(--color-text-muted)]">
                          Budget Used
                        </span>
                        <span className="text-sm font-semibold">
                          {log.budget_used ? `$${log.budget_used}` : "N/A"}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic border-l-2 border-[var(--color-accent-cyan)] pl-4 py-1">
                      "{log.notes}"
                    </p>

                    {log.attached_photos && log.attached_photos.length > 0 && (
                      <div className="mt-2">
                        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2 block">
                          Attached Photos
                        </span>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                          {log.attached_photos.map((p) => (
                            <img
                              key={p.id}
                              src={p.image}
                              alt="Log Attachment"
                              className="h-16 w-16 object-cover border border-[var(--color-border-subtle)] rounded-lg"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-[var(--color-border-subtle)] gap-3">
                      {log.status === "DRAFT" &&
                      (user?.email === log.site_officer_email ||
                        user?.role === "AGENT" ||
                        user?.role === "ADMIN") ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            setProcessingId(String(log.id));
                            try {
                              await submitLog(log.id);
                              toast(
                                "Weekly Log finalized and archived.",
                                "success",
                              );
                              await fetchFieldData();
                            } finally {
                              setProcessingId(null);
                            }
                          }}
                          disabled={processingId === String(log.id)}
                        >
                          {processingId === String(log.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Finalize Report
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={async () => {
                            setProcessingId(String(log.id));
                            try {
                              await exportPdf(log.id);
                            } finally {
                              setProcessingId(null);
                            }
                          }}
                          disabled={processingId === String(log.id)}
                        >
                          {processingId === String(log.id) ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Download className="w-4 h-4 mr-2" />
                          )}
                          Export PDF
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
              <Camera className="w-6 h-6 text-[var(--color-accent-amber)]" />
              Reality Feed
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {photos.length === 0 ? (
                <div className="col-span-full py-12 border-2 border-dashed border-[var(--color-border-subtle)] rounded-2xl flex flex-col items-center justify-center text-[var(--color-text-muted)]">
                  <Camera className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-xs italic">
                    No visual evidence captured.
                  </span>
                </div>
              ) : (
                photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-strong)] group"
                  >
                    {photo.image ? (
                      <img
                        src={photo.image}
                        alt={photo.caption}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[var(--color-text-muted)]">
                        <Camera className="w-8 h-8 opacity-30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <span className="text-xs text-white font-medium leading-tight">
                        {photo.caption}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Card
              variant="surface"
              padding="md"
              className="mt-4 bg-[var(--color-accent-blue-dim)] border-[var(--color-accent-blue-subtle)]"
            >
              <h3 className="text-sm font-bold text-[var(--color-accent-blue)] mb-2 uppercase tracking-tight">
                Pro Tip
              </h3>
              <p className="text-xs text-[var(--color-text-primary)] leading-relaxed">
                Use the **RFIs** and **Change Orders** modules in the sidebar
                for technical queries or financial updates. This dashboard is
                for site execution only.
              </p>
            </Card>
          </div>
        </div>
      )}

      <FocusView
        isOpen={isLogFormOpen}
        onClose={() => setLogFormOpen(false)}
        title="Execute Weekly Log"
      >
        <WeeklyLogForm
          onCancel={() => setLogFormOpen(false)}
          onSuccess={() => {
            setLogFormOpen(false);
            fetchFieldData();
          }}
        />
      </FocusView>

      <FocusView
        isOpen={isPhotoFormOpen}
        onClose={() => setPhotoFormOpen(false)}
        title="Upload Site Imagery"
      >
        <PhotoUpload
          onCancel={() => setPhotoFormOpen(false)}
          onSuccess={() => {
            setPhotoFormOpen(false);
            fetchFieldData();
          }}
        />
      </FocusView>
    </div>
  );
}
