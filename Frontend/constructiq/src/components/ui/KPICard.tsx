import Card from "./Card";

type TrendType = "up" | "down" | "neutral";

interface KPICardProps {
  title: string;
  value: string | number;
  trend?: TrendType;
  trendValue?: string; // e.g., "12%", "+4 days"
  children?: React.ReactNode; // Optional slot for a Sparkline chart
}

export default function KPICard({
  title,
  value,
  trend,
  trendValue,
  children,
}: KPICardProps) {
  const getTrendConfig = () => {
    switch (trend) {
      case "up":
        return { color: "text-[var(--color-accent-emerald)]", icon: "↑" };
      case "down":
        return { color: "text-[var(--color-accent-red)]", icon: "↓" };
      case "neutral":
      default:
        return { color: "text-[var(--color-text-muted)]", icon: "→" };
    }
  };

  const { color, icon } = getTrendConfig();

  return (
    <Card
      variant="surface"
      padding="md"
      className="flex flex-col gap-1.5 sm:gap-2 min-w-0 overflow-hidden"
    >
      <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] truncate">
        {title}
      </h3>

      {/* Primary Value & Trend block */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 min-w-0">
        <span className="text-lg sm:text-2xl lg:text-3xl font-semibold tabular-nums tracking-tight text-[var(--color-text-primary)] truncate">
          {value}
        </span>

        {trend && trendValue && (
          <span
            className={`text-[10px] sm:text-xs font-medium flex items-center gap-0.5 whitespace-nowrap ${color}`}
          >
            <span>{icon}</span> {trendValue}
          </span>
        )}
      </div>

      {/* Optional Sparkline Slot */}
      {children && (
        <div className="mt-1 sm:mt-2 h-8 sm:h-10 w-full">{children}</div>
      )}
    </Card>
  );
}
