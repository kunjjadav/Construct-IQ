import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";
import { useProjectStore } from "../../store/useProjectStore";

const HomeIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);

const ProjectsIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const FieldOpsIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
  </svg>
);

const RFIIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);

const ChangeOrderIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
    />
  </svg>
);

const DocumentIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
);

const MaintenanceIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

const MilestonesIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const PhotosIcon = () => (
  <svg
    aria-hidden="true"
    focusable="false"
    className="w-5 h-5 shrink-0"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

const CollapseIcon = ({ isCollapsed }: { isCollapsed: boolean }) => (
  <svg
    aria-hidden="true"
    focusable="false"
    className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
    />
  </svg>
);

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  roles: string[];
  /** If true, link only appears when a project is selected (for CLIENT sub-nav) */
  requiresProject?: boolean;
  /** Indentation level for sub-items */
  indent?: boolean;
}

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({
  mobileMenuOpen,
  setMobileMenuOpen,
}: SidebarProps) {
  const user = useAuthStore((state) => state.user);
  const currentProject = useProjectStore((state) => state.currentProject);
  const location = useLocation();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem("constructiq_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, setMobileMenuOpen]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "constructiq_sidebar_collapsed",
        String(isCollapsed),
      );
    } catch {

    }
  }, [isCollapsed]);

  const hasProject = currentProject !== null;

  const navItems: NavItem[] = [
    {
      name: "Project Hub",
      path: "/dashboard",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <HomeIcon />,
    },
    {
      name: "User Directory",
      path: "/directory",
      roles: ["ADMIN", "AGENT"],
      icon: <UsersIcon />,
    },
    {
      name: "Projects",
      path: "/projects",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <ProjectsIcon />,
    },
    {
      name: "RFIs",
      path: "/client/rfis",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <RFIIcon />,
      requiresProject: true,
    },
    {
      name: "Change Orders",
      path: "/client/change-orders",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <ChangeOrderIcon />,
      requiresProject: true,
    },
    {
      name: "Documents",
      path: "/client/documents",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <DocumentIcon />,
      requiresProject: true,
    },
    {
      name: "Milestones",
      path: "/milestones",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <MilestonesIcon />,
      requiresProject: true,
    },
    {
      name: "Photos",
      path: "/photos",
      roles: ["ADMIN", "AGENT", "CLIENT", "SITE_OFFICER"],
      icon: <PhotosIcon />,
      requiresProject: true,
    },
    {
      name: "Field Ops",
      path: "/field",
      roles: ["ADMIN", "AGENT", "SITE_OFFICER"],
      icon: <FieldOpsIcon />,
      requiresProject: true,
    },
    {
      name: "Maintenance",
      path: "/maintenance",
      roles: ["ADMIN", "AGENT", "SITE_OFFICER", "CLIENT"],
      icon: <MaintenanceIcon />,
      requiresProject: true,
    },
  ];

  const visibleLinks = navItems.filter((item) => {
    if (!user || !item.roles.includes(user.role)) return false;
    if (item.requiresProject && !hasProject) return false;
    return true;
  });

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sm:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          fixed sm:relative z-50 flex flex-col h-screen border-r border-[var(--color-border-subtle)]
          bg-[var(--color-bg-app)] transition-all duration-300 ease-in-out shrink-0
          ${isCollapsed ? "sm:w-16 w-64" : "w-64"}
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
        `}
      >
        <div className="flex items-center h-16 px-4 border-b border-[var(--color-border-subtle)] overflow-hidden shrink-0">
          <div className="w-8 h-8 bg-[var(--color-accent-blue)] rounded-lg shrink-0 flex items-center justify-center">
            <span className="text-white font-bold tracking-tighter">IQ</span>
          </div>
          {!isCollapsed && (
            <span className="ml-3 font-semibold tracking-tight whitespace-nowrap">
              ConstructIQ
            </span>
          )}
        </div>

        {hasProject && !isCollapsed && (
          <div className="px-3 py-3 border-b border-[var(--color-border-subtle)] shrink-0">
            <div className="px-2.5 py-2 bg-[var(--color-bg-surface)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
              <p className="text-xs uppercase font-bold tracking-widest text-[var(--color-text-muted)] mb-1">
                Active Project
              </p>
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {currentProject?.name}
              </p>
            </div>
          </div>
        )}

        {hasProject && isCollapsed && (
          <div className="px-2 py-3 border-b border-[var(--color-border-subtle)] shrink-0 flex justify-center">
            <div
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--color-accent-cyan-dim)] flex items-center justify-center"
              title={currentProject?.name}
            >
              <span className="text-xs font-bold text-[var(--color-accent-cyan)]">
                {currentProject?.name?.charAt(0)?.toUpperCase() || "P"}
              </span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-x-hidden overflow-y-auto">
          {visibleLinks.map((item) => {
            const showSectionLabel = item.name === "RFIs" && !isCollapsed;

            return (
              <div key={item.path}>
                {showSectionLabel && (
                  <div className="pt-4 pb-2 px-2.5">
                    <p className="text-xs uppercase font-bold tracking-widest text-[var(--color-text-muted)]">
                      Project Details
                    </p>
                  </div>
                )}
                <NavLink
                  to={item.path}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) => `
                  flex items-center ${item.indent && !isCollapsed ? "pl-5" : "px-2.5"} ${!item.indent || isCollapsed ? "px-2.5" : ""} py-2 rounded-[var(--radius-md)]
                  transition-colors duration-150 ease-out group
                  ${
                    isActive
                      ? "bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)] font-medium"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-interactive)] hover:text-[var(--color-text-primary)]"
                  }
                `}
                >
                  {item.icon}
                  {!isCollapsed && (
                    <span className="ml-3 whitespace-nowrap">{item.name}</span>
                  )}
                </NavLink>
              </div>
            );
          })}

          {!hasProject && !isCollapsed && (
            <div className="mt-4 px-2.5 py-3">
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Select a project from the{" "}
                <span className="font-semibold text-[var(--color-accent-cyan)]">
                  Projects
                </span>{" "}
                page to see project-specific data.
              </p>
            </div>
          )}
        </nav>

        <div className="p-2 border-t border-[var(--color-border-subtle)] shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex items-center justify-center w-full p-2 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-bg-interactive)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <CollapseIcon isCollapsed={isCollapsed} />
          </button>
        </div>
      </aside>
    </>
  );
}
