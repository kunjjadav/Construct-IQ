import type { RFIRecord } from "../../api/rfi";
import Avatar from "../ui/Avatar"; // Ignore visual casing error in VSCode
import Badge from "../ui/Badge";

export default function RFIQuestionNode({ rfi }: { rfi: RFIRecord }) {
  const dateStr = new Date(rfi.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dueDateStr = rfi.due_date
    ? new Date(rfi.due_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "No SLA";

  return (
    <div className="flex flex-col gap-4 border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 rounded-[var(--radius-xl)]">
      <div className="flex justify-between items-start gap-4">
        <div className="flex items-center gap-3">
          <Avatar name={rfi.submitted_by_email} size="md" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight">
              {rfi.submitted_by_email}
            </span>
            <span className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
              RFI-{String(rfi.id).substring(0, 8)} • {dateStr}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge status={rfi.status} />
        </div>
      </div>

      <div className="h-px w-full bg-[var(--color-border-subtle)]" />

      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] leading-tight">
        {rfi.title}
      </h3>

      <div className="bg-[var(--color-bg-interactive)] p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)]">
        <p className="text-[var(--color-text-secondary)] whitespace-pre-wrap leading-relaxed text-sm">
          {rfi.description}
        </p>
      </div>

      <div className="flex items-center gap-6 mt-2">
        {rfi.location_ref && Object.keys(rfi.location_ref).length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-text-muted)] tracking-wider">
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            {JSON.stringify(rfi.location_ref)}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-text-muted)] tracking-wider">
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          SLA: {dueDateStr}
        </div>
      </div>
    </div>
  );
}
