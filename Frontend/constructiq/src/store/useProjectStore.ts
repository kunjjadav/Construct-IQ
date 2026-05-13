import { create } from "zustand";
import type { TeamMemberProfile } from "./useAuthStore";

export interface Project {
  id: string;
  name: string;
  status:
    | "PLANNING"
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "ARCHIVED"
    | "PENDING_APPROVAL";
  address: string | null;
  budget_total: string;
  budget_spent: string;
  completion_pct: string;
  team?: {
    clients: TeamMemberProfile[];
    agents: TeamMemberProfile[];
    site_officers: TeamMemberProfile[];
  };
  milestones_summary?: {
    total: number;
    approved: number;
    pending_approval: number;
  };
  created_at: string;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  clear: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => {
    if (project) {
      try {
        localStorage.setItem("constructiq_last_project", project.id);
      } catch {
      }
    }
    set({ currentProject: project });
  },

  clear: () => {
    try {
      localStorage.removeItem("constructiq_last_project");
    } catch {
    }
    set({ projects: [], currentProject: null });
  },
}));
