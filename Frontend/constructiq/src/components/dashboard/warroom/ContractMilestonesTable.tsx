import Card from "../../ui/Card";
import EmptyState from "../../ui/EmptyState";
import Badge from "../../ui/Badge";
import type { MilestoneRecord } from "../../../api/milestones";
import { formatCurrency } from "../../../utils/formatters";

interface ContractMilestonesTableProps {
  milestones: MilestoneRecord[];
}

/**
 * Displays a table of the first 5 contract milestones prioritizing progress tracking.
 */
export default function ContractMilestonesTable({
  milestones,
}: ContractMilestonesTableProps) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="heading-sm text-[var(--color-text-primary)]">
        Contract Milestones
      </h2>
      <Card variant="surface" padding="none" className="overflow-hidden">
        {milestones.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No milestones set"
              description="Payment checkpoints will appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)] text-right">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[var(--color-text-muted)] text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {milestones.slice(0, 5).map((ms) => (
                  <tr
                    key={ms.id}
                    className="hover:bg-[var(--color-bg-interactive)] transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="font-medium text-[var(--color-text-primary)] text-sm">
                        {ms.name}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[var(--color-text-secondary)] text-right">
                      {formatCurrency(parseFloat(ms.payment_amount))}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Badge status={ms.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
