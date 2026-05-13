import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useProjectStore } from "../../store/useProjectStore";
import Avatar from "../ui/Avatar";
import NotificationBell from "../notifications/NotificationBell";

interface TopBarProps {
  onToggleMobileMenu: () => void;
}

export default function TopBar({ onToggleMobileMenu }: TopBarProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const currentProject = useProjectStore((state) => state.currentProject);
  const projects = useProjectStore((state) => state.projects);
  const setCurrentProject = useProjectStore((state) => state.setCurrentProject);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsDropdownOpen(false);
    };
    if (isDropdownOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isDropdownOpen]);

  return (
    <header className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] shrink-0 gap-2 sm:gap-4">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="sm:hidden p-2 -ml-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-interactive)] rounded-md focus:outline-none shrink-0"
          aria-label="Toggle menu"
        >
          <svg
            aria-hidden="true"
            focusable="false"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {projects.length > 0 && (
          <div
            className="relative min-w-0 flex-1 max-w-[200px] sm:max-w-xs"
            ref={dropdownRef}
          >
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`
                w-full flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl
                bg-[var(--color-bg-elevated)] border transition-all duration-200
                text-left min-w-0 group
                ${
                  isDropdownOpen
                    ? "border-[var(--color-accent-cyan)] shadow-[0_0_0_1px_var(--color-accent-cyan),0_4px_20px_rgba(0,0,0,0.3)]"
                    : "border-[var(--color-border-strong)] hover:border-[var(--color-border-focus)] shadow-sm hover:shadow-md"
                }
              `}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 transition-all duration-300 ${
                  currentProject
                    ? "bg-[var(--color-accent-emerald)] shadow-[0_0_6px_var(--color-accent-emerald)]"
                    : "bg-[var(--color-text-muted)]"
                }`}
              />

              <span className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] truncate flex-1">
                {currentProject?.name || "Select Project..."}
              </span>

              <svg
                aria-hidden="true"
                focusable="false"
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--color-text-muted)] shrink-0 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl overflow-hidden animate-fade-in-down glass-panel"
                role="listbox"
              >
                <div className="max-h-64 overflow-y-auto py-1">
                  {projects.map((p) => {
                    const isSelected = currentProject?.id === p.id;
                    return (
                      <button
                        type="button"
                        key={p.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setCurrentProject(p);
                          setIsDropdownOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 text-left transition-all duration-150
                          ${
                            isSelected
                              ? "bg-[var(--color-accent-cyan-dim)] text-[var(--color-accent-cyan)]"
                              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-interactive)] hover:text-[var(--color-text-primary)]"
                          }
                        `}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all ${
                            isSelected
                              ? "bg-[var(--color-accent-cyan)] shadow-[0_0_4px_var(--color-accent-cyan)]"
                              : "bg-transparent"
                          }`}
                        />
                        <span className="text-xs sm:text-sm font-medium truncate">
                          {p.name}
                        </span>
                        {isSelected && (
                          <svg
                            aria-hidden="true"
                            focusable="false"
                            className="w-3.5 h-3.5 ml-auto shrink-0 text-[var(--color-accent-cyan)]"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <NotificationBell />

        <div className="h-5 w-px bg-[var(--color-border-subtle)] hidden sm:block" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium tracking-tight text-[var(--color-text-primary)]">
              {user?.email
                ?.split("@")[0]
                ?.replace(/[._-]/g, " ")
                ?.replace(/\b\w/g, (c) => c.toUpperCase()) || "User"}
            </span>
            <span className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
              {user?.role?.replace(/_/g, " ")}
            </span>
          </div>
          <Avatar name={user?.email || "U"} size="md" />

          <button
            type="button"
            onClick={logout}
            aria-label="Sign out"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-accent-red)] transition-colors"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
