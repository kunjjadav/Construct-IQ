
interface EncumbranceTimelineProps {
  currentStatus: string;
  estimatedAmount?: string;
  actualAmount?: string;
  varianceAmount?: string;
  compact?: boolean;
}

const FSM_STEPS = [
  { key: "DRAFT", label: "Draft", icon: "📝" },
  { key: "FUNDS_CHECK", label: "Funds Check", icon: "🔍" },
  { key: "ENCUMBERED", label: "Encumbered", icon: "🔒" },
  { key: "RECONCILING", label: "Reconciling", icon: "⚖️" },
  { key: "APPROVED", label: "Approved", icon: "✅" },
] as const;

const BRANCH_STATES: Record<
  string,
  { label: string; icon: string; color: string }
> = {
  CONSENT_REQUIRED: {
    label: "Consent Required",
    icon: "⚠️",
    color: "var(--color-accent-amber)",
  },
  REJECTED: { label: "Rejected", icon: "❌", color: "var(--color-accent-red)" },
};

function getStepIndex(status: string): number {
  const idx = FSM_STEPS.findIndex((s) => s.key === status);
  if (idx !== -1) return idx;
  if (status === "CONSENT_REQUIRED") return 3.5;
  if (status === "REJECTED") return -1;
  return -1;
}

export default function EncumbranceTimeline({
  currentStatus,
  compact = false,
}: EncumbranceTimelineProps) {
  const currentIndex = getStepIndex(currentStatus);
  const isBranch = currentStatus in BRANCH_STATES;
  const branchInfo = BRANCH_STATES[currentStatus];

  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-2"}`}>
      <div className="flex items-center w-full">
        {FSM_STEPS.map((step, idx) => {
          const isCompleted =
            currentIndex > idx || (currentIndex === idx && !isBranch);
          const isCurrent = step.key === currentStatus;
          const isReachable = currentIndex >= idx;

          return (
            <div
              key={step.key}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex items-center justify-center rounded-full border-2 transition-all duration-300
                    ${compact ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm"}
                    ${
                      isCurrent
                        ? "border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan-dim)] shadow-[0_0_8px_var(--color-accent-cyan)]"
                        : isCompleted
                          ? "border-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald-dim)]"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-bg-interactive)]"
                    }
                  `}
                >
                  {isCompleted && !isCurrent ? "✓" : step.icon}
                </div>
                {!compact && (
                  <span
                    className={`text-[9px] mt-1 font-bold tracking-wider uppercase whitespace-nowrap ${
                      isReachable
                        ? "text-[var(--color-text-secondary)]"
                        : "text-[var(--color-text-muted)]"
                    }`}
                  >
                    {step.label}
                  </span>
                )}
              </div>

              {idx < FSM_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 transition-colors duration-300 ${
                    currentIndex > idx
                      ? "bg-[var(--color-accent-emerald)]"
                      : "bg-[var(--color-border-subtle)]"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {isBranch && branchInfo && (
        <div
          className="flex items-center gap-1.5 self-center px-2.5 py-1 rounded-full text-xs font-bold border animate-pulse"
          style={{
            borderColor: branchInfo.color,
            color: branchInfo.color,
            backgroundColor: `color-mix(in srgb, ${branchInfo.color} 10%, transparent)`,
          }}
        >
          <span>{branchInfo.icon}</span>
          <span className="tracking-wider uppercase">{branchInfo.label}</span>
        </div>
      )}
    </div>
  );
}
