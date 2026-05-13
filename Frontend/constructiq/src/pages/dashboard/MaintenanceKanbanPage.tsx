import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjectStore } from "../../store/useProjectStore";
import { useAuthStore } from "../../store/useAuthStore";
import {
  listMaintenance,
  updateStatus,
  type MaintenanceRecord,
  type MaintenanceStatus,
} from "../../api/maintenance";
import { toast } from "../../components/ui/Toast";
import EmptyState from "../../components/ui/EmptyState";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import FocusView from "../../components/layout/FocusView";
import CreateMaintenanceForm from "../../components/maintenance/CreateMaintenanceForm";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  Flag,
  Calendar,
  Plus,
  Search,
  ChevronRight,
} from "lucide-react";

const FILTER_TABS: {
  id: MaintenanceStatus;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "REPORTED",
    label: "New Requests",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "RESOLVED",
    label: "Resolved",
    icon: <CheckCircle className="w-4 h-4" />,
  },
];

const getPriorityStyles = (prio: string) => {
  switch (prio) {
    case "CRITICAL":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "HIGH":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "MEDIUM":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    default:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};

export default function MaintenanceKanbanPage() {
  const currentProject = useProjectStore((state) => state.currentProject);
  const user = useAuthStore((state) => state.user);

  const [tasks, setTasks] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] =
    useState<MaintenanceStatus>("REPORTED");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateFormOpen, setCreateFormOpen] = useState(false);

  useEffect(() => {
    if (!currentProject) return;
    loadTasks();
  }, [currentProject]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await listMaintenance(currentProject!.id);
      setTasks(data);
    } catch (err) {
      toast("Failed to load maintenance requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusMove = async (
    taskId: string,
    newStatus: MaintenanceStatus,
  ) => {
    const taskToMove = tasks.find((t) => t.id === taskId);
    if (!taskToMove) return;

    const oldStatus = taskToMove.status;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    );

    try {
      await updateStatus(taskId, newStatus);
      toast("Task status updated", "success");
    } catch (err) {
      toast("Failed to update task status", "error");
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)),
      );
    }
  };

  if (!currentProject) {
    return (
      <div className="flex w-full h-full items-center justify-center pt-20">
        <EmptyState
          title="No Project Selected"
          description="Use the project selector in the top bar to view Maintenance."
        />
      </div>
    );
  }

  const filteredTasks = tasks.filter((t) => {
    const isActiveStatus =
      activeFilter === "RESOLVED"
        ? t.status === "RESOLVED" || t.status === "CLOSED"
        : t.status === activeFilter;

    const isSearchMatch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isActiveStatus && isSearchMatch;
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Maintenance Tracker
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1 truncate">
            {currentProject.name} — Facility repair records
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setCreateFormOpen(true)}
          className="flex-none w-full sm:w-auto mt-2 md:mt-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Raise Request
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full scrollbar-hide">
          {FILTER_TABS.map((tab) => {
            let count = 0;
            if (tab.id === "RESOLVED") {
              count = tasks.filter(
                (t) => t.status === "RESOLVED" || t.status === "CLOSED",
              ).length;
            } else {
              count = tasks.filter((t) => t.status === tab.id).length;
            }

            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`
                                    flex items-center justify-center gap-2 flex-1 shrink-0 px-2 sm:px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-[var(--radius-md)] whitespace-nowrap transition-colors
                                    ${
                                      activeFilter === tab.id
                                        ? "bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)] shadow-sm border border-[var(--color-accent-cyan)]/20"
                                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-interactive)] border border-transparent"
                                    }
                                `}
              >
                <span
                  className={
                    activeFilter === tab.id ? "opacity-100" : "opacity-60"
                  }
                >
                  {tab.icon}
                </span>
                {tab.label}
                {count > 0 && (
                  <span className="ml-1 text-xs opacity-80 bg-[var(--color-bg-app)] px-2 py-0.5 rounded-full border border-[var(--color-border-subtle)]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder="Search repairs by title or issue description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)] transition-all text-[var(--color-text-primary)]"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? "No matching maintenance tickets"
              : "No tickets in this category"
          }
          description={
            searchQuery
              ? "Try adjusting your search terms."
              : "When new repairs are raised, they will appear here."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={task.id}
              >
                <Card
                  variant="surface"
                  padding="md"
                  className="h-full flex flex-col group hover:border-[var(--color-border-strong)] transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3 gap-4">
                    <h3 className="font-semibold text-[var(--color-text-primary)] leading-tight flex-1">
                      {task.title}
                    </h3>
                    <span
                      className={`text-[10px] items-center gap-1 font-bold px-2 py-1 rounded uppercase tracking-wider border shrink-0 ${getPriorityStyles(task.priority)}`}
                    >
                      <Flag className="w-3 h-3 inline-block -mt-0.5 mr-1" />
                      {task.priority}
                    </span>
                  </div>

                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 mb-6 flex-1">
                    {task.description}
                  </p>

                  <div className="border-t border-[var(--color-border-subtle)] pt-4 mt-auto">
                    <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)] mb-4">
                      <div
                        className="truncate max-w-[150px]"
                        title={task.reporter_email}
                      >
                        {task.reporter_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(task.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(user?.role === "ADMIN" || user?.role === "AGENT") &&
                        activeFilter === "REPORTED" && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="w-full text-xs"
                            onClick={() =>
                              handleStatusMove(task.id, "IN_PROGRESS")
                            }
                          >
                            Mark In Progress
                            <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      {(user?.role === "ADMIN" || user?.role === "AGENT") &&
                        activeFilter === "IN_PROGRESS" && (
                          <Button
                            size="sm"
                            variant="primary"
                            className="w-full text-xs"
                            onClick={() =>
                              handleStatusMove(task.id, "RESOLVED")
                            }
                          >
                            Mark Resolved
                            <CheckCircle className="w-3 h-3 ml-1" />
                          </Button>
                        )}

                      {activeFilter === "RESOLVED" && (
                        <div className="w-full text-center py-1.5 text-xs font-semibold text-[var(--color-accent-emerald)] bg-[var(--color-accent-emerald-dim)] rounded border border-[var(--color-accent-emerald)]/20">
                          Issue Resolved
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <FocusView
        isOpen={isCreateFormOpen}
        onClose={() => setCreateFormOpen(false)}
        title="Raise Maintenance Request"
      >
        <CreateMaintenanceForm
          projectId={currentProject.id}
          onSuccess={() => {
            setCreateFormOpen(false);
            toast("Request successfully created.", "success");
            loadTasks(); // Refresh state
          }}
          onCancel={() => setCreateFormOpen(false)}
        />
      </FocusView>
    </div>
  );
}
