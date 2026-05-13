import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface CostCategory {
  name: string;
  value: number;
}

interface CostBreakdownProps {
  data: CostCategory[];
}

const COLORS = [
  "var(--color-accent-cyan)",
  "var(--color-accent-purple)",
  "var(--color-accent-emerald)",
  "var(--color-accent-amber)",
  "var(--color-accent-blue)",
];

import { formatCurrencyCompact } from "../../utils/formatters";

export default function CostBreakdownDonut({ data }: CostBreakdownProps) {
  const displayData = data && data.length > 0 ? data : [];
  const totalValue = displayData.reduce((sum, item) => sum + item.value, 0);

  const chartData =
    totalValue === 0 ? [{ name: "No utilization yet", value: 1 }] : displayData;

  const chartColors =
    totalValue === 0 ? ["var(--color-bg-interactive)"] : COLORS;

  if (!displayData || displayData.length === 0)
    return (
      <div className="w-full h-48 flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-subtle)] rounded-[var(--radius-xl)] text-sm">
        No cost categories defined yet.
      </div>
    );

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              stroke="var(--color-bg-surface)"
              strokeWidth={2}
              isAnimationActive={totalValue > 0}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>

            {totalValue > 0 && (
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border-strong)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--color-text-primary)",
                  fontSize: "14px",
                }}
                itemStyle={{ color: "var(--color-text-primary)" }}
                formatter={(
                  value:
                    | number
                    | string
                    | readonly (number | string)[]
                    | undefined,
                ) => {
                  const val = Array.isArray(value) ? value[0] : value;
                  return formatCurrencyCompact(Number(val || 0));
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 w-full mt-2">
        {displayData.map((item, idx) => (
          <div key={item.name} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{
                backgroundColor:
                  totalValue === 0
                    ? "var(--color-bg-interactive)"
                    : COLORS[idx % COLORS.length],
              }}
            />
            <span className="text-xs text-[var(--color-text-secondary)] font-medium truncate">
              {item.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
