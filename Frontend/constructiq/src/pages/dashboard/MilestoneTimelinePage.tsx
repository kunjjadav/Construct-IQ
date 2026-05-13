import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "../../store/useProjectStore";
import {
  listMilestones,
  type MilestoneRecord,
  type MilestoneStatus,
} from "../../api/milestones";
import { toast } from "../../components/ui/Toast";
import EmptyState from "../../components/ui/EmptyState";
import Card from "../../components/ui/Card";
import {
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  CircleDot,
  Ban,
  Search,
} from "lucide-react";

type FilterTab = "ALL" | MilestoneStatus;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "NOT_STARTED", label: "Not Started" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PENDING_APPROVAL", label: "Pending Approval" },
  { key: "APPROVED", label: "Approved" },
  { key: "PAID", label: "Paid" },
];

const getStatusConfig = (status: MilestoneStatus) => {
  switch (status) {
    case "NOT_STARTED":
      return {
        icon: <Ban className="w-4 h-4" />,
        color: "text-[var(--color-text-muted)]",
        bg: "bg-[var(--color-bg-interactive)]",
        border: "border-[var(--color-border-subtle)]",
        label: "Not Started",
      };
    case "IN_PROGRESS":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-[var(--color-accent-amber)]",
        bg: "bg-[var(--color-accent-amber-dim)]",
        border: "border-[var(--color-accent-amber)]/20",
        label: "In Progress",
      };
    case "PENDING_APPROVAL":
      return {
        icon: <CircleDot className="w-4 h-4" />,
        color: "text-[var(--color-accent-blue)]",
        bg: "bg-[var(--color-accent-blue-dim)]",
        border: "border-[var(--color-accent-blue)]/20",
        label: "Pending Approval",
      };
    case "APPROVED":
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-[var(--color-accent-emerald)]",
        bg: "bg-[var(--color-accent-emerald-dim)]",
        border: "border-[var(--color-accent-emerald)]/20",
        label: "Approved",
      };
    case "PAID":
      return {
        icon: <DollarSign className="w-4 h-4" />,
        color: "text-[var(--color-accent-cyan)]",
        bg: "bg-[var(--color-accent-cyan-dim)]",
        border: "border-[var(--color-accent-cyan)]/20",
        label: "Paid",
      };
    default:
      return {
        icon: <CircleDot className="w-4 h-4" />,
        color: "text-[var(--color-text-muted)]",
        bg: "bg-[var(--color-bg-interactive)]",
        border: "border-[var(--color-border-subtle)]",
        label: status,
      };
  }
};

const formatCurrency = (amount: string) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function MilestoneTimelinePage() {
  const currentProject = useProjectStore((state) => state.currentProject);

  const [milestones, setMilestones] = useState<MilestoneRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!currentProject) return;
    const controller = new AbortController();
    loadMilestones(controller.signal);
    return () => controller.abort();
  }, [currentProject]);

  const loadMilestones = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await listMilestones(currentProject!.id, signal);
      setMilestones(data);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      toast("Failed to load milestones", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Select a project to view milestones."
        />
      </div>
    );
  }

  const filtered = milestones
    .filter((m) => activeFilter === "ALL" || m.status === activeFilter)
    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const totalBudget = milestones.reduce(
    (sum, m) => sum + parseFloat(m.payment_amount || "0"),
    0,
  );
  const paidAmount = milestones
    .filter((m) => m.status === "PAID")
    .reduce((sum, m) => sum + parseFloat(m.payment_amount || "0"), 0);
  const approvedAmount = milestones
    .filter((m) => m.status === "APPROVED")
    .reduce((sum, m) => sum + parseFloat(m.payment_amount || "0"), 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Milestone Timeline
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
            {currentProject.name} — Payment checkpoints & approval tracking
          </p>
        </div>
      </div>

      {!loading && milestones.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="surface" padding="md">
            <p className="text-xs uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1">
              Total Budget
            </p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)] tabular-nums">
              {formatCurrency(String(totalBudget))}
            </p>
          </Card>
          <Card variant="surface" padding="md">
            <p className="text-xs uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1">
              Approved
            </p>
            <p className="text-2xl font-bold text-[var(--color-accent-emerald)] tabular-nums">
              {formatCurrency(String(approvedAmount))}
            </p>
          </Card>
          <Card variant="surface" padding="md">
            <p className="text-xs uppercase tracking-widest font-bold text-[var(--color-text-muted)] mb-1">
              Paid Out
            </p>
            <p className="text-2xl font-bold text-[var(--color-accent-cyan)] tabular-nums">
              {formatCurrency(String(paidAmount))}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "ALL"
                ? milestones.length
                : milestones.filter((m) => m.status === tab.key).length;
            return (
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
                {count > 0 && (
                  <span className="ml-1.5 text-xs opacity-60">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            searchQuery || activeFilter !== "ALL"
              ? "No matching milestones"
              : "No milestones defined"
          }
          description={
            searchQuery || activeFilter !== "ALL"
              ? "Try adjusting filters."
              : "Milestones will appear here once set up."
          }
        />
      ) : (
        <div className="relative">
          <div className="absolute left-[23px] top-4 bottom-4 w-0.5 bg-[var(--color-border-subtle)]" />

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((milestone, index) => {
                const config = getStatusConfig(milestone.status);
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    key={milestone.id}
                    className="relative flex items-start gap-4 pl-2"
                  >
                    <div
                      className={`relative z-10 shrink-0 w-[44px] h-[44px] rounded-full flex items-center justify-center border-2 ${config.bg} ${config.border} ${config.color}`}
                    >
                      {config.icon}
                    </div>

                    <Card
                      variant="surface"
                      padding="md"
                      className="flex-1 group hover:border-[var(--color-border-strong)] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-cyan)] transition-colors">
                          {milestone.name}
                        </h3>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border shrink-0 ${config.bg} ${config.border} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[var(--color-text-muted)]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Due:{" "}
                            {new Date(milestone.due_date).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        {milestone.completion_date && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-[var(--color-accent-emerald)]" />
                            <span>
                              Completed:{" "}
                              {new Date(
                                milestone.completion_date,
                              ).toLocaleDateString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--color-text-secondary)]">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>
                            {formatCurrency(milestone.payment_amount)}
                          </span>
                        </div>
                        {milestone.approved_by_email && (
                          <div className="text-[var(--color-accent-emerald)]">
                            Approved by: {milestone.approved_by_email}
                          </div>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
