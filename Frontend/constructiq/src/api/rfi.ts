import api from "./axiosInstance";

export type RFIStatus = "OPEN" | "PENDING_RESPONSE" | "ANSWERED" | "CLOSED";

export interface RFIRecord {
  id: string;
  project: number | string;
  project_name: string;
  title: string;
  description: string;
  response: string;
  status: RFIStatus;
  due_date: string | null;
  location_ref: Record<string, unknown> | null;
  submitted_by: number | string;
  submitted_by_email: string;
  assigned_to: number | string | null;
  assigned_to_email: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listRFIs(
  projectId: string | number,
  status?: RFIStatus,
  signal?: AbortSignal,
): Promise<RFIRecord[]> {
  const query = status
    ? `?project=${projectId}&status=${status}`
    : `?project=${projectId}`;
  const response = await api.get(`/api/rfi/${query}`, { signal });
  return response.data;
}

export async function createRFI(data: Partial<RFIRecord>): Promise<RFIRecord> {
  const response = await api.post("/api/rfi/", data);
  return response.data;
}

export async function answerRFI(
  id: string | number,
  responseText: string,
): Promise<RFIRecord> {
  const res = await api.post(`/api/rfi/${id}/answer/`, {
    response: responseText,
  });
  return res.data;
}

export async function approveRFI(id: string | number): Promise<RFIRecord> {
  const res = await api.post(`/api/rfi/${id}/approve/`);
  return res.data;
}
