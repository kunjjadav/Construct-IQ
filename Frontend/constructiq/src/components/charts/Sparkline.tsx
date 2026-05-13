import { ResponsiveContainer, LineChart, Line } from "recharts";

export interface SparklineDataPoint {
  value: number;
}

interface SparklineProps {
  data: SparklineDataPoint[];
  color?: string; // Optional hex or CSS var override, usually cyan/emerald/red
  strokeWidth?: number;
}

export default function Sparkline({
  data,
  color = "var(--color-text-primary)",
  strokeWidth = 2,
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            isAnimationActive={true}
            animationDuration={800}
            style={{ padding: 0, margin: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
