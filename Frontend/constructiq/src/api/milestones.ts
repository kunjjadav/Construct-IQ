import api from "./axiosInstance";

export type MilestoneStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PAID";

export interface MilestoneRecord {
  id: string;
  project: string | number;
  project_name: string;
  name: string;
  due_date: string;
  completion_date: string | null;
  payment_amount: string;
  status: MilestoneStatus;
  approved_by: string | number | null;
  approved_by_email: string | null;
  approval_token: string | null;
}

export async function listMilestones(
  projectId: string | number,
  signal?: AbortSignal,
): Promise<MilestoneRecord[]> {
  const response = await api.get(`/api/milestones/?project=${projectId}`, {
    signal,
  });
  const allMilestones: MilestoneRecord[] = response.data;
  return allMilestones.filter((m) => String(m.project) === String(projectId));
}

export async function approveMilestone(
  id: string | number,
  approvalToken: string,
): Promise<MilestoneRecord> {
  const response = await api.post(`/api/milestones/${id}/approve/`, {
    approval_token: approvalToken,
  });
  return response.data;
}
