import { useEffect, useState, useCallback } from "react";
import { Users, Search, XCircle, UserPlus } from "lucide-react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import { motion } from "framer-motion";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import api from "../../api/axiosInstance";
import Switch from "../../components/ui/Switch";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { toast } from "../../components/ui/Toast";

interface ProjectAssignment {
  project_id: number;
  project_name: string;
  project_status: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
}

interface AdminUserRecord {
  id: number;
  email: string;
  role: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
  projects: ProjectAssignment[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<
    "ALL" | "CLIENT" | "SITE_OFFICER" | "AGENT"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmToggle, setConfirmToggle] = useState<{
    id: number;
    email: string;
    active: boolean;
  } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{
    userId: number;
    projectId: number;
    projectName: string;
  } | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const roleQuery = filterRole !== "ALL" ? `?role=${filterRole}` : "";
      const url = `/api/admin/users/${roleQuery}`;
      const response = await api.get<AdminUserRecord[]>(url);
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast("Admin query failed. Please verify 5g network stability.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [filterRole]);

  useEffect(() => {
    setIsLoading(true); // Set loading to true before fetching
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!confirmToggle) return;
    setIsToggling(true);
    try {
      await api.post(`/api/admin/users/${confirmToggle.id}/toggle_status/`);
      await fetchUsers();
      setConfirmToggle(null);
    } catch {
      toast("Failed to toggle user status", "error");
    } finally {
      setIsToggling(false);
    }
  };

  const handleRemoveFromProject = async () => {
    if (!confirmRemove) return;
    setIsToggling(true);
    try {
      await api.post(
        `/api/admin/users/${confirmRemove.userId}/remove_from_project/`,
        {
          project_id: confirmRemove.projectId,
        },
      );
      await fetchUsers();
      setConfirmRemove(null);
    } catch {
      toast("Failed to remove user from project", "error");
    } finally {
      setIsToggling(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const emailMatch = u.email
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const phoneMatch = u.phone ? u.phone.includes(searchQuery) : false;
    return emailMatch || (searchQuery ? phoneMatch : false);
  });

  const roleFilterTabs = [
    { id: "ALL", label: "All Users" },
    { id: "CLIENT", label: "Clients" },
    { id: "SITE_OFFICER", label: "Site Officers" },
    { id: "AGENT", label: "Agents" },
  ] as const;

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full animate-fade-in pb-12 overflow-x-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              User Directory{" "}
              <span className="block sm:inline text-base sm:text-2xl lg:text-3xl text-[var(--color-text-muted)] font-normal">
                — Admin Portal
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              Manage Clients, Agents, and Site Officers across all projects.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-1 p-1 bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] overflow-x-auto w-full scrollbar-hide relative">
            {roleFilterTabs.map((tab) => {
              const isActive = filterRole === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setFilterRole(tab.id)}
                  className={`relative flex-1 text-center px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap z-10 ${
                    isActive
                      ? "text-[var(--color-accent-cyan)] shadow-sm"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeUserTab"
                      className="absolute inset-0 bg-[var(--color-accent-cyan-dim)] border border-[var(--color-accent-cyan)]/20 rounded-lg -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative group w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] group-focus-within:text-[var(--color-accent-blue)] transition-colors" />
            <input
              type="text"
              placeholder="Search by email or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--color-bg-surface)] border border-[var(--color-border-subtle)] rounded-xl py-2 sm:py-2.5 pl-10 pr-4 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue-dim)] transition-all"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-20">
          <Spinner size="lg" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card
          variant="surface"
          className="flex items-center justify-center min-h-[40vh]"
        >
          <EmptyState
            title="No Users Found"
            description="There are no users matching this filter."
          />
        </Card>
      ) : (
        <>
          <div className="block lg:hidden flex flex-col gap-3">
            {filteredUsers.map((user) => (
              <Card
                key={user.id}
                variant="surface"
                padding="md"
                className="flex flex-col gap-3 border-[var(--color-border-subtle)]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center border border-[var(--color-border-subtle)] shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)] truncate">
                      {user.email}
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)] uppercase tracking-tight">
                      Joined {new Date(user.date_joined).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge status={user.role} isActive={user.is_active} />
                </div>

                {user.projects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {user.projects.map((p) => (
                      <div
                        key={p.project_id}
                        className="group/proj flex items-center gap-1.5 bg-[var(--color-bg-elevated)] px-2 sm:px-3 py-1 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-red-dim)] transition-all"
                      >
                        <span className="text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] truncate max-w-[120px]">
                          {p.project_name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmRemove({
                              userId: user.id,
                              projectId: p.project_id,
                              projectName: p.project_name,
                            })
                          }
                          className="p-0.5 rounded-md hover:bg-[var(--color-accent-red-dim)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-all"
                          title="Remove Assignment"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                      Access
                    </span>
                    <Switch
                      checked={user.is_active}
                      onChange={() =>
                        setConfirmToggle({
                          id: user.id,
                          email: user.email,
                          active: user.is_active,
                        })
                      }
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] shadow-sm transition-all"
                    title="Assign to Project"
                  >
                    <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          <Card
            variant="surface"
            padding="none"
            className="overflow-hidden shadow-xl border-[var(--color-border-subtle)] hidden lg:block"
          >
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-bg-elevated)]/50 border-b border-[var(--color-border-subtle)]">
                    <th className="py-5 px-6 text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                      User Profile
                    </th>
                    <th className="py-5 px-6 text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                      Role Status
                    </th>
                    <th className="py-5 px-6 text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase">
                      Assigned Projects
                    </th>
                    <th className="py-5 px-6 text-xs font-bold tracking-widest text-[var(--color-text-muted)] uppercase text-right">
                      Access Management
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group/row hover:bg-[var(--color-bg-surface)] transition-all"
                    >
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-[var(--color-bg-subtle)] flex items-center justify-center border border-[var(--color-border-subtle)] group-hover/row:border-[var(--color-accent-blue)] transition-colors">
                            <Users className="w-5 h-5 text-[var(--color-text-muted)] group-hover/row:text-[var(--color-accent-blue)]" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-[var(--color-text-primary)]">
                              {user.email}
                            </span>
                            <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-tighter">
                              Joined{" "}
                              {new Date(user.date_joined).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <Badge status={user.role} isActive={user.is_active} />
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        {user.projects.length === 0 ? (
                          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] italic">
                            <XCircle className="w-3 h-3" /> Unassigned
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {user.projects.map((p) => (
                              <div
                                key={p.project_id}
                                className="group/proj flex items-center gap-2 bg-[var(--color-bg-elevated)] px-3 py-1.5 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-red-dim)] transition-all"
                              >
                                <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                                  {p.project_name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmRemove({
                                      userId: user.id,
                                      projectId: p.project_id,
                                      projectName: p.project_name,
                                    })
                                  }
                                  className="opacity-0 group-hover/proj:opacity-100 p-0.5 rounded-md hover:bg-[var(--color-accent-red-dim)] text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-all"
                                  title="Remove Assignment"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-6">
                          <div className="flex flex-col items-end gap-1 px-4 py-2 bg-[var(--color-bg-elevated)]/40 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-blue)] transition-all group/switch shadow-sm">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] mb-0.5">
                              Application Access
                            </span>
                            <Switch
                              checked={user.is_active}
                              onChange={() =>
                                setConfirmToggle({
                                  id: user.id,
                                  email: user.email,
                                  active: user.is_active,
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2.5 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-subtle)] shadow-sm transition-all"
                              title="Assign to Project"
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <ConfirmModal
        isOpen={confirmToggle !== null}
        onClose={() => setConfirmToggle(null)}
        onConfirm={handleToggleStatus}
        isLoading={isToggling}
        title="Security Authorization"
        message={
          confirmToggle?.active
            ? `CRITICAL ACTION: You are about to block all application access for ${confirmToggle?.email}. They will be immediately disconnected from active sessions.`
            : `You are restoring application access for ${confirmToggle?.email}. They will be able to log in and participate in projects once again.`
        }
        confirmText={
          confirmToggle?.active ? "Confirm Deactivation" : "Confirm Activation"
        }
        variant={confirmToggle?.active ? "danger" : "primary"}
      />

      <ConfirmModal
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemoveFromProject}
        isLoading={isToggling}
        title="Remove Project Assignment"
        message={`Are you sure you want to remove ${filteredUsers.find((u) => u.id === confirmRemove?.userId)?.email} from the project "${confirmRemove?.projectName}"? All their associated records will persist, but their active access to this project workspace will be revoked.`}
        confirmText="Confirm Removal"
        variant="danger"
      />
    </div>
  );
}
