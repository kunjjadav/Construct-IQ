import api from "./axiosInstance";

export type MaintenancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type MaintenanceStatus =
  | "REPORTED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

export interface MaintenanceRecord {
  id: string;
  project: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reporter_email: string;
  assigned_agent_email: string | null;
  created_at: string;
}

export async function listMaintenance(
  projectId: string,
): Promise<MaintenanceRecord[]> {
  const response = await api.get(
    `/api/maintenance-requests/?project=${projectId}`,
  );
  return response.data;
}

export async function createMaintenance(
  data: Partial<MaintenanceRecord>,
): Promise<MaintenanceRecord> {
  const response = await api.post("/api/maintenance-requests/", data);
  return response.data;
}

export async function updateStatus(
  id: string,
  status: MaintenanceStatus,
): Promise<MaintenanceRecord> {
  const response = await api.patch(`/api/maintenance-requests/${id}/`, {
    status,
  });
  return response.data;
}
