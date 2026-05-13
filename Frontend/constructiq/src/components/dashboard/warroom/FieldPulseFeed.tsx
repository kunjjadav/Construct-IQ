import Badge from "../../ui/Badge";
import Button from "../../ui/Button";
import type { WeeklyLogRecord } from "../../../api/weeklyLogs";

interface FieldPulseFeedProps {
  logs: WeeklyLogRecord[];
  userRole: "ADMIN" | "AGENT" | "SITE_OFFICER" | "CLIENT" | string;
  onNavigate: (path: string) => void;
}

/**
 * Displays a list of recent weekly logs for quick visibility into site pulse.
 */
export default function FieldPulseFeed({
  logs,
  userRole,
  onNavigate,
}: FieldPulseFeedProps) {
  const canViewLogs = userRole === "SITE_OFFICER" || userRole === "ADMIN";

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
        Recent Field Pulse
      </h3>
      <div className="flex flex-col gap-3">
        {logs.length === 0 ? (
          <div className="p-6 bg-[var(--color-bg-interactive)] border border-dashed border-[var(--color-border-subtle)] rounded-xl text-center">
            <p className="text-xs text-[var(--color-text-muted)] italic">
              No weekly logs submitted yet.
            </p>
          </div>
        ) : (
          logs.slice(0, 4).map((log) => (
            <div
              key={log.id}
              className="p-3 bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)] flex flex-col gap-1.5 transition-colors hover:border-[var(--color-border-strong)]"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Week of {log.week_start_date}
                </span>
                <Badge status={log.status} />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                {log.notes}
              </p>
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold">
                <span>Crew: {log.crew_count}</span>
                <span>•</span>
                <span>${log.budget_used} spent</span>
                <span>•</span>
                <span>{log.weather}</span>
              </div>
            </div>
          ))
        )}
        {canViewLogs && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={() => onNavigate("/field")}
          >
            View Field Logs
          </Button>
        )}
      </div>
    </section>
  );
}
