import Card from "../../ui/Card";
import { Activity } from "lucide-react";

export interface AuditEvent {
  event_type: string;
  actor_email: string;
  created_at: string;
  payload?: Record<string, unknown>;
}

interface AuditTrailCardProps {
  events: AuditEvent[];
}

export default function AuditTrailCard({ events }: AuditTrailCardProps) {
  return (
    <Card
      variant="surface"
      padding="md"
      className="flex flex-col gap-5 border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] backdrop-blur-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[var(--color-accent-blue)]" />
          Project Audit Trail
        </h3>
        <span className="text-xs text-[var(--color-text-muted)] font-bold">
          LIVE FEED
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {events.length === 0 ? (
          <p className="text-xs italic text-[var(--color-text-muted)] text-center py-4">
            Waiting for system signals...
          </p>
        ) : (
          (() => {
            const visibleEvents = events.slice(0, 8);
            return visibleEvents.map((event, i) => (
              <div
                key={`${event.event_type}-${event.created_at}-${i}`}
                className="group/ev flex items-start gap-4"
              >
                <div className="relative flex flex-col items-center">
                  <div
                    className={`z-10 w-2 h-2 rounded-full mt-1.5 transition-shadow ${i === 0 ? "bg-[var(--color-accent-emerald)] shadow-[0_0_8px_var(--color-accent-emerald)]" : "bg-[var(--color-border-subtle)]"}`}
                  />
                  {i !== visibleEvents.length - 1 && (
                    <div className="absolute top-3 w-px h-10 bg-gradient-to-b from-[var(--color-border-subtle)] to-transparent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                    {event.event_type.replace(/_/g, " ")}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium text-[var(--color-text-muted)] truncate">
                      {event.actor_email}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      •
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(event.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ));
          })()
        )}
      </div>
    </Card>
  );
}
