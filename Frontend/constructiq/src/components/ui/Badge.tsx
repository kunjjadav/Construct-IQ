type BadgeSize = "sm" | "md";

type StatusType =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "OPEN"
  | "PENDING_RESPONSE"
  | "ANSWERED"
  | "CLOSED"
  | "PENDING_APPROVAL"
  | "CLIENT_REVIEW"
  | "REPORTED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "PENDING"
  | "LOCKED"
  | "ON_TRACK"
  | "AT_RISK"
  | "WARNING"
  | "CRITICAL"
  | "FUNDS_CHECK"
  | "ENCUMBERED"
  | "RECONCILING"
  | "CONSENT_REQUIRED"
  | string;

interface BadgeProps {
  status: StatusType;
  size?: BadgeSize;
  className?: string;
  isActive?: boolean;
}

const STATUS_MAP: Record<string, [string, string, string]> = {
  DRAFT: [
    "bg-[var(--color-bg-interactive)]",
    "text-[var(--color-text-secondary)]",
    "bg-[var(--color-text-muted)]",
  ],
  CLOSED: [
    "bg-[var(--color-bg-interactive)]",
    "text-[var(--color-text-secondary)]",
    "bg-[var(--color-text-muted)]",
  ],
  PLANNING: [
    "bg-[var(--color-bg-interactive)]",
    "text-[var(--color-text-secondary)]",
    "bg-[var(--color-text-muted)]",
  ],

  ACTIVE: [
    "bg-[var(--color-accent-cyan-dim)]",
    "text-[var(--color-accent-cyan)]",
    "bg-[var(--color-accent-cyan)]",
  ],
  OPEN: [
    "bg-[var(--color-accent-cyan-dim)]",
    "text-[var(--color-accent-cyan)]",
    "bg-[var(--color-accent-cyan)]",
  ],
  IN_PROGRESS: [
    "bg-[var(--color-accent-cyan-dim)]",
    "text-[var(--color-accent-cyan)]",
    "bg-[var(--color-accent-cyan)]",
  ],
  ASSIGNED: [
    "bg-[var(--color-accent-cyan-dim)]",
    "text-[var(--color-accent-cyan)]",
    "bg-[var(--color-accent-cyan)]",
  ],

  PENDING: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  PENDING_RESPONSE: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  PENDING_APPROVAL: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  CLIENT_REVIEW: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  ON_HOLD: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  REPORTED: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],

  APPROVED: [
    "bg-[var(--color-accent-emerald-dim)]",
    "text-[var(--color-accent-emerald)]",
    "bg-[var(--color-accent-emerald)]",
  ],
  COMPLETED: [
    "bg-[var(--color-accent-emerald-dim)]",
    "text-[var(--color-accent-emerald)]",
    "bg-[var(--color-accent-emerald)]",
  ],
  RESOLVED: [
    "bg-[var(--color-accent-emerald-dim)]",
    "text-[var(--color-accent-emerald)]",
    "bg-[var(--color-accent-emerald)]",
  ],
  ANSWERED: [
    "bg-[var(--color-accent-emerald-dim)]",
    "text-[var(--color-accent-emerald)]",
    "bg-[var(--color-accent-emerald)]",
  ],

  SUBMITTED: [
    "bg-[var(--color-accent-blue-dim)]",
    "text-[var(--color-accent-blue)]",
    "bg-[var(--color-accent-blue)]",
  ],
  LOCKED: [
    "bg-[var(--color-accent-blue-dim)]",
    "text-[var(--color-accent-blue)]",
    "bg-[var(--color-accent-blue)]",
  ],

  FROZEN: [
    "bg-[var(--color-accent-blue-dim)]",
    "text-[var(--color-accent-blue)]",
    "bg-[var(--color-accent-blue)]",
  ],
  ARCHIVED: [
    "bg-[var(--color-bg-interactive)]",
    "text-[var(--color-text-secondary)]",
    "bg-[var(--color-text-muted)]",
  ],

  REJECTED: [
    "bg-[var(--color-accent-red-dim)]",
    "text-[var(--color-accent-red)]",
    "bg-[var(--color-accent-red)]",
  ],
  CRITICAL: [
    "bg-[var(--color-accent-red-dim)]",
    "text-[var(--color-accent-red)]",
    "bg-[var(--color-accent-red)]",
  ],
  ERROR: [
    "bg-[var(--color-accent-red-dim)]",
    "text-[var(--color-accent-red)]",
    "bg-[var(--color-accent-red)]",
  ],

  ON_TRACK: [
    "bg-[var(--color-accent-emerald-dim)]",
    "text-[var(--color-accent-emerald)]",
    "bg-[var(--color-accent-emerald)]",
  ],
  AT_RISK: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  WARNING: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  FUNDS_CHECK: [
    "bg-[var(--color-bg-interactive)]",
    "text-[var(--color-text-secondary)]",
    "bg-[var(--color-text-muted)]",
  ],
  ENCUMBERED: [
    "bg-[var(--color-accent-blue-dim)]",
    "text-[var(--color-accent-blue)]",
    "bg-[var(--color-accent-blue)]",
  ],
  RECONCILING: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
  CONSENT_REQUIRED: [
    "bg-[var(--color-accent-amber-dim)]",
    "text-[var(--color-accent-amber)]",
    "bg-[var(--color-accent-amber)]",
  ],
};

const FALLBACK: [string, string, string] = [
  "bg-[var(--color-bg-interactive)]",
  "text-[var(--color-text-secondary)]",
  "bg-[var(--color-text-muted)]",
];

export default function Badge({
  status,
  size = "md",
  className = "",
  isActive,
}: BadgeProps) {
  const [bgColor, textColor, defaultDotColor] = STATUS_MAP[status] ?? FALLBACK;

  let dotColor = defaultDotColor;
  if (isActive === true) {
    dotColor =
      "bg-[var(--color-accent-emerald)] shadow-[0_0_8px_var(--color-accent-emerald)]";
  } else if (isActive === false) {
    dotColor = "bg-[var(--color-text-muted)]";
  }

  const label = status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const sizeStyles =
    size === "sm"
      ? "px-1.5 py-0.5 text-xs gap-1"
      : "px-2.5 py-1   text-xs     gap-1.5";

  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span
      className={`
        inline-flex items-center font-bold tracking-tight rounded-xl border border-[var(--color-border-subtle)] whitespace-nowrap
        ${sizeStyles} ${bgColor} ${textColor} ${className}
      `}
    >
      <span
        className={`${dotSize} ${dotColor} rounded-full flex-shrink-0 transition-all duration-500`}
      />
      {label}
    </span>
  );
}
