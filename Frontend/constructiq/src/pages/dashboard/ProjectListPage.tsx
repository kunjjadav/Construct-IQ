import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listProjects } from "../../api/projects";
import { useProjectStore } from "../../store/useProjectStore";
import { formatCurrencyK } from "../../utils/formatters";
import type { Project } from "../../store/useProjectStore";
import { toast } from "../../components/ui/Toast";

import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import FocusView from "../../components/layout/FocusView";
import CreateProjectForm from "../../components/project/CreateProjectForm";
import EditProjectForm from "../../components/project/EditProjectForm";
import { approveProject } from "../../api/projects";
import { useAuthStore } from "../../store/useAuthStore";

export default function ProjectListPage() {
  const [localProjects, setLocalProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);

  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const canCreate = user?.role === "ADMIN" || user?.role === "AGENT";
  const isAdmin = user?.role === "ADMIN";

  const setProjectsGlobal = useProjectStore((state) => state.setProjects);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await listProjects();
      setLocalProjects(data);
      setProjectsGlobal(data); // Keep global Dropdown (TopBar) in sync
    } catch (error) {
      console.error("Failed to load projects table", error);
      toast("Unable to load securely encrypted project list.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [setProjectsGlobal]);

  const handleApprove = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      await approveProject(projectId);
      toast("Project approved successfully.", "success");
      await fetchProjects();
    } catch (err) {
      toast("Failed to approve project.", "error");
    }
  };

  const handleEdit = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setEditProjectId(projectId);
  };

  const filteredProjects = localProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.address &&
        p.address.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const handleRowClick = (project: Project) => {
    setCurrentProject(project);

    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col gap-8 w-full animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Active Projects Portfolio
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mt-1 ml-1">
            Global directory of all properties under management.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto md:min-w-[280px] shrink-0">
          <div className="relative group w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-cyan)] transition-colors pointer-events-none">
              <svg
                aria-hidden="true"
                focusable="false"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search projects or locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all text-[var(--color-text-primary)]"
            />
          </div>
          {canCreate && (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="whitespace-nowrap"
            >
              New Project
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex w-full items-center justify-center p-20">
          <Spinner size="lg" />
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={
            searchQuery
              ? "Try adjusting your search criteria."
              : "There are no active projects assigned to your account."
          }
        />
      ) : (
        <Card
          variant="surface"
          padding="none"
          className="overflow-hidden shadow-sm border border-[var(--color-border-strong)]"
        >
          <div className="block md:hidden divide-y divide-[var(--color-border-subtle)]">
            {filteredProjects.map((project) => {
              const total = parseFloat(project.budget_total) || 1;
              const spent = parseFloat(project.budget_spent) || 0;
              const burnPct = (spent / total) * 100;
              const isOverBudget = burnPct > 100;

              return (
                <div
                  key={project.id}
                  onClick={() => handleRowClick(project)}
                  className="p-4 flex flex-col gap-3 hover:bg-[var(--color-bg-interactive)] active:bg-[var(--color-bg-subtle)] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-[var(--color-text-primary)] truncate text-base">
                        {project.name}
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        {String(project.id).split("-")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <Badge status={project.status} size="sm" />
                      {isAdmin && project.status === "PENDING_APPROVAL" && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => handleApprove(e, project.id)}
                          className="py-1 px-2 text-[10px]"
                        >
                          Approve
                        </Button>
                      )}
                      {canCreate && (
                        <button
                          type="button"
                          onClick={(e) => handleEdit(e, project.id)}
                          className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)] hover:bg-[var(--color-bg-interactive)] transition-colors"
                          title="Edit Project"
                        >
                          <svg
                            aria-hidden="true"
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-sm text-[var(--color-text-secondary)] truncate flex-1 pr-2">
                      {project.address || "—"}
                    </span>
                    <div className="flex flex-col items-end shrink-0">
                      <span
                        className={`text-sm font-bold ${isOverBudget ? "text-[var(--color-accent-red)]" : "text-[var(--color-text-primary)]"}`}
                      >
                        {formatCurrencyK(project.budget_spent)}
                      </span>
                      <div className="w-16 h-1 mt-1 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${isOverBudget ? "bg-[var(--color-accent-red)]" : "bg-[var(--color-accent-cyan)]"}`}
                          style={{ width: `${Math.min(burnPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)]">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Project Name & Key
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    Location
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] text-right">
                    Budget Consumed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {filteredProjects.map((project) => {
                  const total = parseFloat(project.budget_total) || 1;
                  const spent = parseFloat(project.budget_spent) || 0;
                  const burnPct = (spent / total) * 100;
                  const isOverBudget = burnPct > 100;

                  return (
                    <tr
                      key={project.id}
                      onClick={() => handleRowClick(project)}
                      className="group hover:bg-[var(--color-bg-interactive)] transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent-cyan)] transition-colors">
                          {project.name}
                        </div>
                        <div className="text-xs text-[var(--color-text-muted)] font-mono mt-0.5">
                          {String(project.id).split("-")[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge status={project.status} />
                          {isAdmin && project.status === "PENDING_APPROVAL" && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={(e) => handleApprove(e, project.id)}
                              className="py-1 px-3 text-xs"
                            >
                              Approve
                            </Button>
                          )}
                          {canCreate && (
                            <button
                              type="button"
                              onClick={(e) => handleEdit(e, project.id)}
                              className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-accent-cyan)] hover:bg-[var(--color-bg-interactive)] transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit Project"
                            >
                              <svg
                                aria-hidden="true"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                        {project.address || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex flex-col items-end">
                          <span
                            className={`font-medium ${isOverBudget ? "text-[var(--color-accent-red)]" : "text-[var(--color-text-primary)]"}`}
                          >
                            {formatCurrencyK(project.budget_spent)}
                          </span>
                          <div className="w-24 h-1.5 bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] rounded-full mt-1.5 overflow-hidden flex">
                            <div
                              className={`h-full ${isOverBudget ? "bg-[var(--color-accent-red)]" : "bg-[var(--color-accent-cyan)]"}`}
                              style={{ width: `${Math.min(burnPct, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <FocusView
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Establish New Project"
      >
        <CreateProjectForm
          onSuccess={() => {
            setIsModalOpen(false);
            fetchProjects();
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </FocusView>

      <FocusView
        isOpen={!!editProjectId}
        onClose={() => setEditProjectId(null)}
        title="Edit Project"
      >
        {editProjectId && (
          <EditProjectForm
            projectId={editProjectId}
            onSuccess={() => {
              setEditProjectId(null);
              fetchProjects();
            }}
            onCancel={() => setEditProjectId(null)}
          />
        )}
      </FocusView>
    </div>
  );
}
