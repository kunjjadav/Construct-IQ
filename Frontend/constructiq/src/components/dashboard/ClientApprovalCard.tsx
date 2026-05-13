import { useState } from "react";
import type { ChangeOrderRecord } from "../../api/changeOrders";
import { formatCurrency, formatCurrencyAdaptive } from "../../utils/formatters";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

interface ClientApprovalCardProps {
  co: ChangeOrderRecord;
  onApprove: (id: string, token: string) => Promise<void>;
  onReject: (id: string, token: string) => Promise<void>;
}

export default function ClientApprovalCard({
  co,
  onApprove,
  onReject,
}: ClientApprovalCardProps) {
  const [isLoading, setIsLoading] = useState<"APPROVE" | "REJECT" | null>(null);

  const signatureToken = co.approval_token ?? "";

  const handleApprove = async () => {
    setIsLoading("APPROVE");
    try {
      await onApprove(co.id, signatureToken);
    } finally {
      setIsLoading(null);
    }
  };

  const handleReject = async () => {
    setIsLoading("REJECT");
    try {
      await onReject(co.id, signatureToken);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card
      variant="surface"
      padding="md"
      className="border-l-4 border-[var(--color-accent-amber)] w-full flex flex-col gap-4"
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs font-mono text-[var(--color-text-muted)]">
            CO-{String(co.id).substring(0, 8)}
          </span>
          <h3 className="heading-sm text-[var(--color-text-primary)] mt-0.5">
            {co.title}
          </h3>
        </div>
        <Badge status={co.status} />
      </div>

      <p className="text-sm text-[var(--color-text-secondary)]">
        {co.description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--color-bg-interactive)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
            Cost Impact
          </span>
          <span
            className="font-semibold text-[var(--color-accent-red)] tabular-nums truncate"
            title={formatCurrency(parseFloat(co.cost_impact) || 0)}
          >
            +{formatCurrencyAdaptive(parseFloat(co.cost_impact) || 0)}
          </span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
            Schedule Impact
          </span>
          <span className="font-semibold text-[var(--color-text-primary)] tabular-nums truncate">
            +{co.schedule_impact_days} Days
          </span>
        </div>
      </div>

      {co.status === "PENDING" && (
        <div className="flex gap-3 justify-end mt-2">
          <Button
            variant="ghost"
            className="text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red-dim)]"
            onClick={handleReject}
            isLoading={isLoading === "REJECT"}
            disabled={isLoading !== null}
          >
            Reject Change
          </Button>
          <Button
            variant="primary"
            onClick={handleApprove}
            isLoading={isLoading === "APPROVE"}
            disabled={isLoading !== null}
          >
            Authorize Signature
          </Button>
        </div>
      )}
    </Card>
  );
}
