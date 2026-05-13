import ClientApprovalCard from "../ClientApprovalCard";
import { AlertTriangle, ArrowRight } from "lucide-react";
import type { ChangeOrderRecord } from "../../../api/changeOrders";

interface PendingApprovalsSectionProps {
  pendingCOs: ChangeOrderRecord[];
  onApproveCO: (id: string, token: string) => Promise<void>;
  onRejectCO: (
    id: string,
    token: string,
    reason_code?: string,
  ) => Promise<void>;
  onNavigate: (path: string) => void;
}

/**
 * Handles presentation and list rendering of urgent pending approvals (Change Orders)
 */
export default function PendingApprovalsSection({
  pendingCOs,
  onApproveCO,
  onRejectCO,
  onNavigate,
}: PendingApprovalsSectionProps) {
  const totalPending = pendingCOs.length;
  if (totalPending === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="heading-sm text-[var(--color-accent-amber)] flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Requires Your Authorization ({totalPending})
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {pendingCOs.slice(0, 2).map((co) => (
          <ClientApprovalCard
            key={co.id}
            co={co}
            onApprove={onApproveCO}
            onReject={onRejectCO}
          />
        ))}
      </div>
      {pendingCOs.length > 2 && (
        <button
          type="button"
          onClick={() => onNavigate("/client/change-orders")}
          className="text-sm text-[var(--color-accent-cyan)] hover:underline self-start flex items-center gap-1 transition-colors"
        >
          View all pending approvals <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </section>
  );
}
