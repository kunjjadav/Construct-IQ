import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuthStore } from "../../store/useAuthStore";
import { listRFIs } from "../../api/rfi";
import type { RFIRecord, RFIStatus } from "../../api/rfi";
import { toast } from "../../components/ui/Toast";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import FocusView from "../../components/layout/FocusView";
import CreateRFIForm from "../../components/rfi/CreateRFIForm";
import RFIView from "../dashboard/RFIView";
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

type FilterTab = "ALL" | RFIStatus;

export default function ClientRFIs() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(true);
  const [rfis, setRfis] = useState<RFIRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRFIFormOpen, setRFIFormOpen] = useState(false);
  const [viewRFIId, setViewRFIId] = useState<string | null>(null);

  const fetchRFIs = useCallback(async () => {
    if (!currentProject) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await listRFIs(currentProject.id);
      setRfis(data || []);
    } catch (error) {
      console.error("Failed to load RFIs", error);
      toast("Network error while querying Request block.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  useEffect(() => {
    fetchRFIs();
  }, [fetchRFIs]);

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Use the project selector in the top bar to view RFIs."
        />
      </div>
    );
  }

  const filteredRFIs = rfis
    .filter((rfi) => activeFilter === "ALL" || rfi.status === activeFilter)
    .filter(
      (rfi) =>
        rfi.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rfi.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const getStatusIcon = (status: RFIStatus) => {
    switch (status) {
      case "OPEN":
        return (
          <AlertCircle className="w-4 h-4 text-[var(--color-accent-blue)]" />
        );
      case "PENDING_RESPONSE":
        return <Clock className="w-4 h-4 text-[var(--color-accent-amber)]" />;
      case "ANSWERED":
        return (
          <CheckCircle className="w-4 h-4 text-[var(--color-accent-emerald)]" />
        );
      case "CLOSED":
        return (
          <ShieldCheck className="w-4 h-4 text-[var(--color-text-muted)]" />
        );
      default:
        return null;
    }
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: rfis.length },
    {
      key: "ANSWERED",
      label: "Answered",
      count: rfis.filter((r) => r.status === "ANSWERED").length,
    },
    {
      key: "OPEN",
      label: "Open",
      count: rfis.filter((r) => r.status === "OPEN").length,
    },
    {
      key: "CLOSED",
      label: "Closed",
      count: rfis.filter((r) => r.status === "CLOSED").length,
    },
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Requests for Information
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
            {currentProject.name} — Track and raise queries with the project
            team
          </p>
        </div>
        {(user?.role === "CLIENT" || user?.role === "ADMIN") && (
          <Button
            variant="primary"
            onClick={() => setRFIFormOpen(true)}
            className="flex-none w-full sm:w-auto mt-2 md:mt-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Raise RFI
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full scrollbar-hide">
          {filterTabs.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`
                flex-1 text-center shrink-0 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-[var(--radius-md)] whitespace-nowrap transition-colors
                ${
                  activeFilter === tab.key
                    ? "bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)] shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)]"
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search RFIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      ) : filteredRFIs.length === 0 ? (
        <EmptyState
          title={
            searchQuery || activeFilter !== "ALL"
              ? "No matching RFIs"
              : "No RFIs submitted yet"
          }
          description={
            searchQuery || activeFilter !== "ALL"
              ? "Try adjusting your filters or search terms."
              : "Use the 'Raise RFI' button to ask questions about the project."
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRFIs.map((rfi) => (
            <Card
              key={rfi.id}
              variant="surface"
              padding="md"
              className="cursor-pointer hover:border-[var(--color-border-strong)] transition-all duration-200 hover:-translate-y-0.5 group"
              onClick={() => setViewRFIId(String(rfi.id))}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{getStatusIcon(rfi.status)}</div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-[var(--color-text-primary)] text-sm block truncate group-hover:text-[var(--color-accent-cyan)] transition-colors">
                      {rfi.title}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5 block">
                      RFI-{String(rfi.id).substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>
                <Badge status={rfi.status} />
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 mb-3">
                {rfi.description}
              </p>

              <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
                <span>
                  Submitted: {new Date(rfi.created_at).toLocaleDateString()}
                </span>
                {rfi.due_date && (
                  <span>
                    Due: {new Date(rfi.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <FocusView
        isOpen={isRFIFormOpen}
        onClose={() => setRFIFormOpen(false)}
        title="Raise New RFI"
      >
        <CreateRFIForm
          projectId={currentProject.id}
          onSuccess={() => {
            setRFIFormOpen(false);
            toast("RFI successfully submitted to the project team.", "success");
            fetchRFIs();
          }}
          onCancel={() => setRFIFormOpen(false)}
        />
      </FocusView>

      <FocusView
        isOpen={viewRFIId !== null}
        onClose={() => setViewRFIId(null)}
        title="View RFI Thread"
      >
        {viewRFIId && (
          <RFIView
            rfiId={viewRFIId}
            onResolved={() => {
              fetchRFIs();
            }}
          />
        )}
      </FocusView>
    </div>
  );
}
