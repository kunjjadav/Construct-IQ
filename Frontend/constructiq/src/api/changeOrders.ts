import api from "./axiosInstance";

export type COStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

export interface ChangeOrderRecord {
  id: string;
  project: number | string;
  project_name: string;
  title: string;
  description: string;
  reason_code: string;
  cost_impact: string;
  schedule_impact_days: number;
  status: COStatus;
  created_by: number | string;
  created_by_email: string;
  approved_by: number | string | null;
  approved_by_email: string | null;
  approval_token: string;
  approved_at: string | null;
  signature_hash: string;
  pdf_s3_key: string;
  created_at: string;
  updated_at: string;
}

export async function listCOs(
  projectId: string | number,
  signal?: AbortSignal,
): Promise<ChangeOrderRecord[]> {
  const response = await api.get(`/api/change-orders/?project=${projectId}`, {
    signal,
  });
  return response.data;
}

export async function createCO(
  data: Partial<ChangeOrderRecord>,
): Promise<ChangeOrderRecord> {
  const response = await api.post("/api/change-orders/", data);
  return response.data;
}

export async function submitCO(
  id: string | number,
): Promise<ChangeOrderRecord> {
  const response = await api.post(`/api/change-orders/${id}/submit/`);
  return response.data;
}

export async function approveCO(
  id: string | number,
  approvalToken: string,
): Promise<ChangeOrderRecord> {
  const response = await api.post(`/api/change-orders/${id}/approve/`, {
    approval_token: approvalToken,
  });
  return response.data;
}

export async function rejectCO(
  id: string | number,
  approvalToken: string,
  reasonCode: string = "",
): Promise<ChangeOrderRecord> {
  const response = await api.post(`/api/change-orders/${id}/reject/`, {
    approval_token: approvalToken,
    reason_code: reasonCode,
  });
  return response.data;
}
