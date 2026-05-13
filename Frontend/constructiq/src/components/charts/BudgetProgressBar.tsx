interface BudgetProgressBarProps {
  spent: number;
  total: number;
}

import { formatCurrency, formatCurrencyAdaptive } from "../../utils/formatters";

export default function BudgetProgressBar({
  spent,
  total,
}: BudgetProgressBarProps) {
  const safeTotal = total > 0 ? total : 1;

  const rawPercentage = (spent / safeTotal) * 100;
  const progressPercentage = Math.min(rawPercentage, 100);

  let barColorClass = "bg-[var(--color-accent-cyan)]";
  if (rawPercentage >= 90) {
    barColorClass = "bg-[var(--color-accent-red)]";
  } else if (rawPercentage >= 75) {
    barColorClass = "bg-[var(--color-accent-amber)]";
  }

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-wrap justify-between items-end gap-2 text-sm">
        <span className="text-[var(--color-text-secondary)] font-medium">
          Budget Burn
        </span>
        <div className="flex flex-col items-end min-w-0">
          <span
            className="data-text font-semibold text-[var(--color-text-primary)] tabular-nums truncate"
            title={formatCurrency(spent)}
          >
            {formatCurrencyAdaptive(spent)}
          </span>
          <span
            className="text-xs text-[var(--color-text-muted)] font-medium tabular-nums truncate"
            title={formatCurrency(total)}
          >
            of {formatCurrencyAdaptive(total)}
          </span>
        </div>
      </div>

      <div className="w-full h-3 bg-[var(--color-bg-interactive)] rounded-full overflow-hidden border border-[var(--color-border-subtle)] relative">
        <div
          className={`h-full ${barColorClass} transition-[width] duration-1000 ease-out`}
          style={{ width: `${progressPercentage}%` }}
        />

        {rawPercentage > 100 && (
          <div className="absolute top-0 bottom-0 left-[100%] w-0.5 bg-white shadow-[0_0_4px_white]" />
        )}
      </div>

      <div className="flex flex-wrap justify-between gap-2 text-xs font-semibold tracking-wide">
        <span className={barColorClass.replace("bg-", "text-")}>
          {rawPercentage.toFixed(1)}% CONSUMED
        </span>

        {rawPercentage > 100 && (
          <span className="text-[var(--color-accent-red)] tabular-nums">
            {formatCurrencyAdaptive(spent - total)} OVER BUDGET
          </span>
        )}
      </div>
    </div>
  );
}
