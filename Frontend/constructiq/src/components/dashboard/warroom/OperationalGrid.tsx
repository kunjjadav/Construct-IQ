import Card from "../../ui/Card";
import {
  MessageSquare,
  FileText,
  FilePlus2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import type { RFIRecord } from "../../../api/rfi";
import type { ChangeOrderRecord } from "../../../api/changeOrders";
import type { DocumentRecord } from "../../../api/documents";

interface OperationalGridProps {
  rfis: RFIRecord[];
  changeOrders: ChangeOrderRecord[];
  documents: DocumentRecord[];
  onNavigate: (path: string) => void;
}

/**
 * Displays summary cards for RFIs, Change Orders, and Documents on the dashboard.
 */
export default function OperationalGrid({
  rfis,
  changeOrders,
  documents,
  onNavigate,
}: OperationalGridProps) {
  const openRFIs = rfis.filter(
    (r) => r.status === "OPEN" || r.status === "PENDING_RESPONSE",
  );
  const answeredRFIs = rfis.filter(
    (r) => r.status === "ANSWERED" || r.status === "CLOSED",
  );

  const visibleCOs = changeOrders.filter((co) => co.status !== "DRAFT");
  const pendingCOs = visibleCOs.filter((co) => co.status === "PENDING");
  const approvedCOs = visibleCOs.filter((c) => c.status === "APPROVED");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card
        variant="interactive"
        padding="md"
        className="group cursor-pointer"
        onClick={() => onNavigate("/client/rfis")}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--color-accent-amber-dim)] border border-[var(--color-accent-amber)] group-hover:scale-110 transition-transform">
            <MessageSquare className="w-5 h-5 text-[var(--color-accent-amber)]" />
          </div>
          <span className="text-xl font-bold tabular-nums">{rfis.length}</span>
        </div>
        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
          Requests for Information (RFI)
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-[var(--color-accent-amber)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              {openRFIs.length} Open
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent-emerald)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              {answeredRFIs.length} Resolved
            </span>
          </div>
        </div>
      </Card>

      <Card
        variant="interactive"
        padding="md"
        className="group cursor-pointer"
        onClick={() => onNavigate("/client/change-orders")}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--color-accent-red-dim)] border border-[var(--color-accent-red)] group-hover:scale-110 transition-transform">
            <FilePlus2 className="w-5 h-5 text-[var(--color-accent-red)]" />
          </div>
          <span className="text-xl font-bold tabular-nums">
            {visibleCOs.length}
          </span>
        </div>
        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
          Change Orders
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-accent-amber)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              {pendingCOs.length} Pending
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent-emerald)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              {approvedCOs.length} Approved
            </span>
          </div>
        </div>
      </Card>

      <Card
        variant="interactive"
        padding="md"
        className="group cursor-pointer"
        onClick={() => onNavigate("/client/documents")}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-xl bg-[var(--color-accent-cyan-dim)] border border-[var(--color-accent-cyan)] group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-[var(--color-accent-cyan)]" />
          </div>
          <span className="text-xl font-bold tabular-nums">
            {documents.length}
          </span>
        </div>
        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
          Digital Vault
        </h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <FileText className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              {documents.length} Files
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-accent-emerald)]" />
            <span className="text-[var(--color-text-secondary)] truncate">
              Secured
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
