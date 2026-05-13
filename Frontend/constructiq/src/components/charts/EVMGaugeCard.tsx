import { useEffect, useState } from "react";

interface EVMGaugeCardProps {
  label: string;
  value: number;
  subtitle?: string;
  thresholds?: { green: number; amber: number };
}

export default function EVMGaugeCard({
  label,
  value,
  subtitle,
  thresholds = { green: 1.0, amber: 0.9 },
}: EVMGaugeCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 50);
    return () => clearTimeout(timer);
  }, [value]);

  const clampedValue = Math.max(0, Math.min(animatedValue, 2));
  const percentage = (clampedValue / 2) * 100;

  const getColor = (v: number) => {
    if (v >= thresholds.green) return "var(--color-accent-emerald)";
    if (v >= thresholds.amber) return "var(--color-accent-amber)";
    return "var(--color-accent-red)";
  };

  const color = getColor(value);

  const radius = 52;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow">
      <div className="relative w-32 h-20">
        <svg viewBox="0 0 120 70" className="w-full h-full overflow-visible">
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="var(--color-border-subtle)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-end justify-center pb-0.5">
          <span
            className="text-2xl font-black tabular-nums tracking-tight transition-colors duration-500"
            style={{ color }}
          >
            {value.toFixed(2)}
          </span>
        </div>
      </div>

      <span className="text-xs font-bold tracking-wider uppercase text-[var(--color-text-secondary)]">
        {label}
      </span>

      {subtitle && (
        <span className="text-[10px] text-[var(--color-text-muted)] -mt-1">
          {subtitle}
        </span>
      )}
    </div>
  );
}
