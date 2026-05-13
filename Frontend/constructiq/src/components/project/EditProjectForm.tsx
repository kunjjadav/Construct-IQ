import React, { useState, useEffect, useCallback } from "react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Spinner from "../ui/Spinner";
import Badge from "../ui/Badge";
import ConfirmModal from "../ui/ConfirmModal";
import { toast } from "../ui/Toast";
import { getProject, updateProject } from "../../api/projects";
import { adminListUsers } from "../../api/users";
import {
  addProjectMember,
  removeProjectMember,
  freezeProjectMember,
  unfreezeProjectMember,
  listProjectMembers,
} from "../../api/projectMembers";
import type { AdminUserRecord } from "../../api/users";
import type { ProjectMemberRecord } from "../../api/projectMembers";
import {
  Snowflake,
  Flame,
  UserMinus,
  UserPlus,
  Shield,
  Briefcase,
  Users,
} from "lucide-react";

interface EditProjectFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

type RoleKey = "CLIENT" | "AGENT" | "SITE_OFFICER";

interface TeamGroupConfig {
  key: RoleKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const TEAM_GROUPS: TeamGroupConfig[] = [
  {
    key: "AGENT",
    label: "Managing Agents",
    icon: Briefcase,
    color: "text-[var(--color-accent-blue)]",
  },
  {
    key: "SITE_OFFICER",
    label: "Site Officers",
    icon: Shield,
    color: "text-[var(--color-accent-purple)]",
  },
  {
    key: "CLIENT",
    label: "Clients / Owners",
    icon: Users,
    color: "text-[var(--color-accent-cyan)]",
  },
];

export default function EditProjectForm({
  projectId,
  onSuccess,
  onCancel,
}: EditProjectFormProps) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("");

  const [currentMembers, setCurrentMembers] = useState<ProjectMemberRecord[]>(
    [],
  );

  const [availableUsers, setAvailableUsers] = useState<
    Record<RoleKey, AdminUserRecord[]>
  >({
    CLIENT: [],
    AGENT: [],
    SITE_OFFICER: [],
  });
  const [addingRole, setAddingRole] = useState<RoleKey | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<ProjectMemberRecord | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);


  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [project, members] = await Promise.all([
        getProject(projectId),
        listProjectMembers(projectId),
      ]);
      setName(project.name);
      setAddress(project.address || "");
      setStatus(project.status);
      setCurrentMembers(members);
    } catch (err) {
      toast("Failed to load project data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProjectData();
    }, 400);
    return () => clearTimeout(timer);
  }, [loadProjectData]);

  useEffect(() => {
    if (!addingRole) return;
    const load = async () => {
      try {
        const users = await adminListUsers(addingRole);
        const activeMemberIds = currentMembers
          .filter((m) => m.role === addingRole)
          .map((m) => m.user);
        setAvailableUsers((prev) => ({
          ...prev,
          [addingRole]: users.filter(
            (u) => u.is_active && !activeMemberIds.includes(u.id),
          ),
        }));
      } catch {
        toast("Failed to load user directory.", "error");
      }
    };
    load();
  }, [addingRole, currentMembers]);


  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Project Name is required.");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await updateProject(projectId, { name, address, status: status as any });
      toast("Project details updated.", "success");
      onSuccess();
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Failed to update project.";
      setError(detail);
    } finally {
      setIsSaving(false);
    }
  };


  const handleAddMember = async (userId: number, role: RoleKey) => {
    setActionLoading(userId);
    try {
      await addProjectMember(projectId, userId, role);
      toast("Team member added.", "success");
      setAddingRole(null);
      const updated = await listProjectMembers(projectId);
      setCurrentMembers(updated);
    } catch (err: any) {
      const detail =
        err.response?.data?.role?.[0] ||
        err.response?.data?.detail ||
        "Failed to add member.";
      toast(detail, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await removeProjectMember(removeTarget.id);
      toast(`${removeTarget.user_email} removed from project.`, "success");
      setRemoveTarget(null);
      const updated = await listProjectMembers(projectId);
      setCurrentMembers(updated);
    } catch (err: any) {
      toast("Failed to remove member.", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  const handleToggleFreeze = async (member: ProjectMemberRecord) => {
    setActionLoading(member.id);
    try {
      if (member.is_frozen) {
        await unfreezeProjectMember(member.id);
        toast(`${member.user_email} access restored.`, "success");
      } else {
        await freezeProjectMember(member.id);
        toast(`${member.user_email} access frozen.`, "success");
      }
      const updated = await listProjectMembers(projectId);
      setCurrentMembers(updated);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "Operation failed.";
      toast(detail, "error");
    } finally {
      setActionLoading(null);
    }
  };


  const MemberRow = ({ member }: { member: ProjectMemberRecord }) => {
    const isActionLoading = actionLoading === member.id;
    return (
      <div
        className={`group/item flex items-center justify-between p-3 rounded-[var(--radius-md)] border transition-all ${
          member.is_frozen
            ? "bg-blue-500/5 border-blue-500/20 opacity-70"
            : "bg-[var(--color-bg-interactive)] border-transparent hover:border-[var(--color-border-subtle)] hover:shadow-sm"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border ${
              member.is_frozen
                ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                : "bg-[var(--color-bg-subtle)] border-[var(--color-border-subtle)] text-[var(--color-text-primary)]"
            }`}
          >
            {member.user_email.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {member.user_email}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge
                status={member.accepted_at ? "ACTIVE" : "PENDING"}
                isActive={member.accepted_at ? !member.is_frozen : undefined}
                size="sm"
              />
              {member.is_frozen && <Badge status="FROZEN" size="sm" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {isActionLoading ? (
            <Spinner size="sm" />
          ) : (
            <>
              <button
                type="button"
                title={member.is_frozen ? "Unfreeze Access" : "Freeze Access"}
                className={`p-1.5 rounded-md transition-colors ${
                  member.is_frozen
                    ? "text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-accent-amber)]"
                }`}
                onClick={() => handleToggleFreeze(member)}
              >
                {member.is_frozen ? (
                  <Flame className="w-4 h-4" />
                ) : (
                  <Snowflake className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                title="Remove Member"
                className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:bg-red-500/10 hover:text-[var(--color-accent-red)] transition-colors"
                onClick={() => setRemoveTarget(member)}
              >
                <UserMinus className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };


  const AddMemberPanel = ({ role }: { role: RoleKey }) => {
    const users = availableUsers[role];
    return (
      <div className="mt-2 border border-[var(--color-border-subtle)] rounded-lg bg-[var(--color-bg-surface)] p-3 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
            Available {role.replace("_", " ")}s
          </span>
          <button
            type="button"
            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            onClick={() => setAddingRole(null)}
          >
            Close
          </button>
        </div>
        <div className="max-h-36 overflow-y-auto flex flex-col gap-1">
          {users.length === 0 ? (
            <span className="text-xs text-[var(--color-text-muted)] italic p-1">
              No available users to add.
            </span>
          ) : (
            users.map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={actionLoading === u.id}
                className="flex items-center gap-2 p-2 w-full text-left hover:bg-[var(--color-bg-interactive)] rounded cursor-pointer transition-colors border border-transparent hover:border-[var(--color-border-focus)]"
                onClick={() => handleAddMember(u.id, role)}
              >
                {actionLoading === u.id ? (
                  <Spinner size="sm" />
                ) : (
                  <UserPlus className="w-4 h-4 text-[var(--color-accent-emerald)]" />
                )}
                <span className="text-sm text-[var(--color-text-primary)] truncate">
                  {u.email}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSaveDetails} className="flex flex-col gap-8 h-full">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Modify project details and manage the core team assignments.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 bg-red-900/20 border border-red-500/50 rounded-md text-red-500 text-sm animate-pulse"
          >
            {error}
          </div>
        )}

        {/* Project Details */}
        <div className="flex flex-col gap-6">
          <Input
            label="Project Name *"
            placeholder="e.g. Phoenix Tower"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <Input
            label="Street Address"
            placeholder="123 Alpha Avenue, Suite 100"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Project Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-[var(--color-bg-interactive)] border border-[var(--color-border-subtle)] rounded-xl py-2.5 px-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-cyan)] transition-all appearance-none cursor-pointer"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Team Management */}
        <div className="border-t border-[var(--color-border-subtle)] pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
              Team Management
            </h3>
            <span className="text-xs text-[var(--color-text-muted)]">
              Add, freeze, or remove team members
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {TEAM_GROUPS.map((group) => {
              const roleMembers = currentMembers.filter(
                (m) => m.role === group.key,
              );
              const isAddingThisRole = addingRole === group.key;

              return (
                <div key={group.key} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
                      <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                        {group.label}
                      </span>
                      <span className="text-xs bg-[var(--color-bg-subtle)] px-2 py-0.5 rounded-full text-[var(--color-text-muted)]">
                        {roleMembers.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs font-medium text-[var(--color-accent-cyan)] hover:text-[var(--color-text-primary)] transition-colors"
                      onClick={() =>
                        setAddingRole(isAddingThisRole ? null : group.key)
                      }
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {isAddingThisRole ? "Cancel" : "Add"}
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {roleMembers.length === 0 ? (
                      <span className="text-xs text-[var(--color-text-muted)] italic p-2">
                        No {group.label.toLowerCase()} assigned.
                      </span>
                    ) : (
                      roleMembers.map((member) => (
                        <MemberRow key={member.id} member={member} />
                      ))
                    )}
                  </div>

                  {isAddingThisRole && <AddMemberPanel role={group.key} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-end gap-3 sticky bottom-0 bg-[var(--color-bg-elevated)] pb-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            className="min-w-[140px]"
          >
            {isSaving ? (
              <Spinner size="sm" className="text-white mr-2" />
            ) : null}
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>

      <ConfirmModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemoveMember}
        title="Remove Team Member"
        message={`Are you sure you want to permanently remove ${removeTarget?.user_email} from this project? This action will revoke their access and send a notification.`}
        confirmText="Remove Member"
        variant="danger"
        isLoading={isRemoving}
      />
    </>
  );
}
