
interface BudgetHealthIndicatorProps {
  cpi: number;
  spi: number;
  size?: "sm" | "md" | "lg";
}

type HealthLevel = "ON_TRACK" | "AT_RISK" | "WARNING" | "CRITICAL";

const HEALTH_CONFIG: Record<
  HealthLevel,
  { label: string; color: string; glow: string; icon: string }
> = {
  ON_TRACK: {
    label: "On Track",
    color: "var(--color-accent-emerald)",
    glow: "0 0 12px var(--color-accent-emerald)",
    icon: "✅",
  },
  AT_RISK: {
    label: "At Risk",
    color: "var(--color-accent-amber)",
    glow: "0 0 12px var(--color-accent-amber)",
    icon: "⚠️",
  },
  WARNING: {
    label: "Warning",
    color: "var(--color-accent-amber)",
    glow: "0 0 12px var(--color-accent-amber)",
    icon: "🟡",
  },
  CRITICAL: {
    label: "Critical",
    color: "var(--color-accent-red)",
    glow: "0 0 12px var(--color-accent-red)",
    icon: "🔴",
  },
};

function getHealthLevel(cpi: number, spi: number): HealthLevel {
  if (cpi >= 1.0 && spi >= 1.0) return "ON_TRACK";
  if (cpi >= 0.9 && spi >= 0.9) return "AT_RISK";
  if (cpi >= 0.8 && spi >= 0.8) return "WARNING";
  return "CRITICAL";
}

const SIZE_STYLES = {
  sm: {
    dot: "w-2 h-2",
    text: "text-[10px]",
    gap: "gap-1",
    px: "px-1.5 py-0.5",
  },
  md: { dot: "w-3 h-3", text: "text-xs", gap: "gap-1.5", px: "px-2.5 py-1" },
  lg: { dot: "w-4 h-4", text: "text-sm", gap: "gap-2", px: "px-3 py-1.5" },
};

export default function BudgetHealthIndicator({
  cpi,
  spi,
  size = "md",
}: BudgetHealthIndicatorProps) {
  const health = getHealthLevel(cpi, spi);
  const config = HEALTH_CONFIG[health];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div
      className={`inline-flex items-center ${sizeStyle.gap} ${sizeStyle.px} rounded-full border`}
      style={{
        borderColor: config.color,
        backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
      }}
    >
      <span
        className={`${sizeStyle.dot} rounded-full flex-shrink-0`}
        style={{
          backgroundColor: config.color,
          boxShadow: config.glow,
          animation:
            health === "CRITICAL"
              ? "pulse 1.5s ease-in-out infinite"
              : undefined,
        }}
      />

      <span
        className={`${sizeStyle.text} font-bold tracking-wide uppercase`}
        style={{ color: config.color }}
      >
        {config.label}
      </span>
    </div>
  );
}
