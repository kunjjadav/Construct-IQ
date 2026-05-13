import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface TimelineDataPoint {
  month: string; // "Jan 2026"
  planned: number; // 150000
  actual: number; // 145000
}

interface SpendTimelineProps {
  data: TimelineDataPoint[];
}

import { formatCurrencyCompact } from "../../utils/formatters";

export default function SpendTimeline({ data }: SpendTimelineProps) {
  if (!data || data.length === 0)
    return (
      <div className="w-full h-64 flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)]">
        Insufficient financial history to generate timeline.
      </div>
    );

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="var(--color-border-subtle)"
          />

          <XAxis
            dataKey="month"
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />

          <YAxis
            tickFormatter={(val) => `$${val / 1000}k`} // Compresses "$150,000" into "$150k" to save width
            tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "var(--color-bg-elevated)",
              borderColor: "var(--color-border-strong)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text-primary)",
            }}
            formatter={(
              value: number | string | readonly (number | string)[] | undefined,
            ) => {
              const val = Array.isArray(value) ? value[0] : value;
              return formatCurrencyCompact(Number(val || 0));
            }}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: "13px", paddingTop: "10px" }}
          />

          <Line
            type="monotone"
            dataKey="planned"
            name="Planned Budget"
            stroke="var(--color-text-muted)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
          />

          <Line
            type="monotone"
            dataKey="actual"
            name="Actual Spend"
            stroke="var(--color-accent-cyan)"
            strokeWidth={3}
            dot={{ r: 3, fill: "var(--color-bg-app)", strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
