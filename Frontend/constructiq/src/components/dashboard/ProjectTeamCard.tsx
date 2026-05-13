import { Users, Shield, Briefcase, Mail, ExternalLink } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import type { TeamMemberProfile } from "../../store/useAuthStore";

interface ProjectTeamCardProps {
  team: {
    clients: TeamMemberProfile[];
    agents: TeamMemberProfile[];
    site_officers: TeamMemberProfile[];
  };
}

export default function ProjectTeamCard({ team }: ProjectTeamCardProps) {
  const allGroups = [
    {
      label: "Agents (Managers)",
      data: team.agents,
      icon: Briefcase,
      color: "text-[var(--color-accent-blue)]",
    },
    {
      label: "Site Officers (Field Supervisors)",
      data: team.site_officers,
      icon: Shield,
      color: "text-[var(--color-accent-purple)]",
    },
    {
      label: "Clients (Owners)",
      data: team.clients,
      icon: Users,
      color: "text-[var(--color-accent-cyan)]",
    },
  ];

  const hasAnyMembers = allGroups.some((g) => g.data.length > 0);

  if (!hasAnyMembers) {
    return (
      <Card
        variant="surface"
        padding="md"
        className="flex flex-col items-center justify-center p-8 opacity-60"
      >
        <Users className="w-12 h-12 text-[var(--color-text-muted)] mb-3" />
        <p className="text-sm text-[var(--color-text-muted)] italic">
          No other team members assigned to this project yet.
        </p>
      </Card>
    );
  }

  return (
    <Card
      variant="surface"
      padding="none"
      className="overflow-hidden flex flex-col h-full bg-[var(--color-bg-surface)] border-[var(--color-border-subtle)]"
    >
      <div className="px-6 py-4 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] flex justify-between items-center">
        <div>
          <h3 className="heading-sm tracking-tight text-[var(--color-text-primary)]">
            Project Team
          </h3>
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-bold">
            Role-Based Roster visibility
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-[var(--color-border-subtle)] scrollbar-hide">
        {allGroups.map((group) => {
          if (group.data.length === 0) return null;

          return (
            <div key={group.label} className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-2 px-1">
                <group.icon className={`w-3.5 h-3.5 ${group.color}`} />
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)]">
                  {group.label}
                </span>
                <span className="text-xs bg-[var(--color-bg-subtle)] px-2 py-0.5 rounded-full text-[var(--color-text-muted)]">
                  {group.data.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {group.data.map((member) => (
                  <div
                    key={member.user_id}
                    className="group/item flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--color-bg-interactive)] border border-transparent hover:border-[var(--color-border-subtle)] hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-text-primary)] font-medium border border-[var(--color-border-subtle)]">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[140px]">
                          {member.email}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-[var(--color-text-muted)]">
                            {member.phone || "No phone"}
                          </span>
                          <Badge
                            status={member.accepted_at ? "ACTIVE" : "PENDING"}
                            isActive={
                              member.accepted_at ? !member.is_frozen : undefined
                            }
                            size="sm"
                          />
                          {member.is_frozen && (
                            <Badge status="FROZEN" size="sm" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Email User"
                        className="p-1.5 rounded-md hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                        onClick={() => window.open(`mailto:${member.email}`)}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="View Details"
                        className="p-1.5 rounded-md hover:bg-[var(--color-bg-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-6 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] flex items-center justify-center gap-2">
        <Users className="w-3 h-3 text-[var(--color-text-muted)]" />
        <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
          Secure Team Directory Enabled
        </span>
      </div>
    </Card>
  );
}
