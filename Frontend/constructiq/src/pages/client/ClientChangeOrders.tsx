
import { useEffect, useState, useCallback } from "react";
import { useProjectStore } from "../../store/useProjectStore";
import { listCOs, approveCO, rejectCO, submitCO } from "../../api/changeOrders";
import type { ChangeOrderRecord } from "../../api/changeOrders";
import { toast } from "../../components/ui/Toast";
import { formatCurrency, formatCurrencyAdaptive } from "../../utils/formatters";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import SkeletonLoader from "../../components/ui/SkeletonLoader";
import ClientApprovalCard from "../../components/dashboard/ClientApprovalCard";
import FocusView from "../../components/layout/FocusView";
import CreateCOForm from "../../components/changeOrders/CreateCOForm";
import { useAuthStore } from "../../store/useAuthStore";
import {
  Search,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";

type FilterTab = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function ClientChangeOrders() {
  const currentProject = useProjectStore((state) => state.currentProject);

  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [changeOrders, setChangeOrders] = useState<ChangeOrderRecord[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCOFormOpen, setCOFormOpen] = useState(false);

  const fetchCOs = useCallback(async () => {
    if (!currentProject) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await listCOs(currentProject.id);
      setChangeOrders(
        (data || []).filter((co) =>
          user?.role === "CLIENT" ? co.status !== "DRAFT" : true,
        ),
      );
    } catch (error) {
      console.error("Failed to load Change Orders", error);
      toast(
        "Network communication failed while fetching financial orders.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [currentProject, user?.role]);

  useEffect(() => {
    fetchCOs();
  }, [fetchCOs]);

  const handleApproveCO = async (id: string, token: string) => {
    try {
      await approveCO(id, token);
      toast("Change Order approved.", "success");
      setChangeOrders((prev) =>
        prev.map((co) =>
          String(co.id) === String(id) ? { ...co, status: "APPROVED" } : co,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to approve Change Order:", err);
      toast("Failed to approve Change Order due to network issue.", "error");
    }
  };

  const handleRejectCO = async (
    id: string,
    token: string,
    reason_code: string = "",
  ) => {
    try {
      await rejectCO(id, token, reason_code);
      toast("Change Order officially rejected.", "success");
      setChangeOrders((prev) =>
        prev.map((co) =>
          String(co.id) === String(id) ? { ...co, status: "REJECTED" } : co,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to reject Change Order:", err);
      toast("Failed to reject Change Order.", "error");
    }
  };

  const handleSubmitCO = async (id: string | number) => {
    try {
      await submitCO(id);
      toast("Change Order submitted for review successfully.", "success");
      setChangeOrders((prev) =>
        prev.map((co) =>
          String(co.id) === String(id) ? { ...co, status: "PENDING" } : co,
        ),
      );
    } catch (err: unknown) {
      console.error("Failed to submit Change Order:", err);
      toast("Failed to submit Change Order.", "error");
    }
  };

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Use the project selector in the top bar to view Change Orders."
        />
      </div>
    );
  }

  const filteredCOs = changeOrders
    .filter((co) => activeFilter === "ALL" || co.status === activeFilter)
    .filter(
      (co) =>
        co.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        co.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

  const pendingCOs = changeOrders.filter((co) => co.status === "PENDING");
  const totalCostImpact = changeOrders.reduce(
    (sum, co) => sum + (parseFloat(co.cost_impact) || 0),
    0,
  );
  const approvedCostImpact = changeOrders
    .filter((co) => co.status === "APPROVED")
    .reduce((sum, co) => sum + (parseFloat(co.cost_impact) || 0), 0);

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: changeOrders.length },
    {
      key: "APPROVED",
      label: "Approved",
      count: changeOrders.filter((c) => c.status === "APPROVED").length,
    },
    {
      key: "PENDING",
      label: "Pending",
      count: changeOrders.filter((c) => c.status === "PENDING").length,
    },
    {
      key: "REJECTED",
      label: "Rejected",
      count: changeOrders.filter((c) => c.status === "REJECTED").length,
    },
  ];

  return (
    <>
      <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
          <div>
            <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              Change Orders
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
              {currentProject.name} — Review cost and schedule modifications
            </p>
          </div>
          {user?.role !== "CLIENT" && (
            <Button
              variant="primary"
              onClick={() => setCOFormOpen(true)}
              className="flex-none w-full sm:w-auto mt-2 md:mt-0"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Raise Change Order
            </Button>
          )}
        </div>

        <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card
            variant="surface"
            padding="sm"
            className="flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-amber-dim)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[var(--color-accent-amber)]" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">
                Pending Approval
              </p>
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                {pendingCOs.length}
              </p>
            </div>
          </Card>

          <Card
            variant="surface"
            padding="sm"
            className="flex items-center gap-2 sm:gap-3 min-w-0"
          >
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-cyan-dim)] flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-[var(--color-accent-cyan)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">
                Total Impact
              </p>
              <p
                className="text-lg font-semibold text-[var(--color-text-primary)] tabular-nums truncate"
                title={formatCurrency(totalCostImpact)}
              >
                {formatCurrencyAdaptive(totalCostImpact)}
              </p>
            </div>
          </Card>

          <Card
            variant="surface"
            padding="sm"
            className="flex items-center gap-2 sm:gap-3 min-w-0 col-span-2 md:col-span-1"
          >
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-accent-emerald-dim)] flex items-center justify-center shrink-0">
              <CheckCircle className="w-5 h-5 text-[var(--color-accent-emerald)]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">
                Approved Impact
              </p>
              <p
                className="text-lg font-semibold text-[var(--color-accent-emerald)] tabular-nums truncate"
                title={formatCurrency(approvedCostImpact)}
              >
                {formatCurrencyAdaptive(approvedCostImpact)}
              </p>
            </div>
          </Card>
        </section>

        <div className="flex flex-col gap-4">
          <div className="flex items-center p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full gap-1 scrollbar-hide">
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
                  <span className="ml-1.5 text-xs opacity-60">
                    ({tab.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
            <input
              type="text"
              placeholder="Search change orders..."
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
        ) : filteredCOs.length === 0 ? (
          <EmptyState
            title={
              searchQuery || activeFilter !== "ALL"
                ? "No matching change orders"
                : "No change orders yet"
            }
            description={
              searchQuery || activeFilter !== "ALL"
                ? "Try adjusting your filters or search terms."
                : "Change orders submitted for this project will appear here."
            }
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredCOs.map((co) =>
              co.status === "PENDING" ? (
                <ClientApprovalCard
                  key={co.id}
                  co={co}
                  onApprove={handleApproveCO}
                  onReject={handleRejectCO}
                />
              ) : (
                <Card
                  key={co.id}
                  variant="surface"
                  padding="md"
                  className="flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">
                        Change Order #{String(co.id).substring(0, 8)}
                      </span>
                      <h3 className="heading-sm text-[var(--color-text-primary)] mt-0.5 truncate">
                        {co.title}
                      </h3>
                    </div>
                    <Badge status={co.status} />
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                    {co.description}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[var(--color-bg-interactive)] p-3 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                        Cost Impact
                      </span>
                      <span
                        className={`font-semibold ${co.status === "APPROVED" ? "text-[var(--color-accent-emerald)]" : "text-[var(--color-text-primary)]"}`}
                      >
                        +{formatCurrency(parseFloat(co.cost_impact) || 0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                        Schedule Impact
                      </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">
                        +{co.schedule_impact_days} Days
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border-subtle)]">
                    <span>
                      Created: {new Date(co.created_at).toLocaleDateString()}
                    </span>
                    {co.approved_at && (
                      <span>
                        Decision:{" "}
                        {new Date(co.approved_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {co.status === "DRAFT" && user?.role !== "CLIENT" && (
                    <div className="pt-3 border-t border-[var(--color-border-subtle)]">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSubmitCO(co.id)}
                        className="w-full sm:w-auto"
                      >
                        Submit for Client Review
                      </Button>
                    </div>
                  )}
                </Card>
              ),
            )}
          </div>
        )}
      </div>

      <FocusView
        isOpen={isCOFormOpen}
        onClose={() => setCOFormOpen(false)}
        title="Raise Change Order"
      >
        <CreateCOForm
          projectId={currentProject.id}
          onSuccess={() => {
            setCOFormOpen(false);
            fetchCOs();
          }}
          onCancel={() => setCOFormOpen(false)}
        />
      </FocusView>
    </>
  );
}
