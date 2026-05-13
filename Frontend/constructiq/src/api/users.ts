import api from "./axiosInstance";

export interface AdminUserRecord {
  id: number;
  email: string;
  role: string;
  phone: string;
  is_active: boolean;
  date_joined: string;
}

export async function adminListUsers(
  role?: string,
): Promise<AdminUserRecord[]> {
  const roleQuery = role && role !== "ALL" ? `?role=${role}` : "";
  const response = await api.get<AdminUserRecord[]>(
    `/api/admin/users/${roleQuery}`,
  );
  return response.data;
}
