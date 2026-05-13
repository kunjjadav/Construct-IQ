import { create } from "zustand";

export type UserRole = "ADMIN" | "AGENT" | "CLIENT" | "SITE_OFFICER";

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  phone?: string;
  is_active?: boolean;
  date_joined?: string;
}

export interface TeamMemberProfile {
  member_id: number;
  user_id: number;
  email: string;
  phone: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  is_frozen: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

function safeParse<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

let savedUser: User | null = null;
try {
  savedUser = safeParse<User>(localStorage.getItem("constructiq_user"));
} catch {
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: savedUser,
  isAuthenticated: savedUser !== null,

  setAuth: (token, user) => {
    try {
      localStorage.setItem("constructiq_user", JSON.stringify(user));
    } catch (err) {
      console.debug("Storage blocked:", err);
    }
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.removeItem("constructiq_user");
      fetch("/api/auth/logout/", {
        method: "POST",
        credentials: "include",
      }).catch(console.error);
    } catch (err) {
      console.debug("Storage removal blocked:", err);
    }
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = "/login";
  },
}));
