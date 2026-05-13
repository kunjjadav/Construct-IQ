import api from "./axiosInstance";

export interface PhotoRecord {
  id: string;
  image: string;
  caption: string;
  created_at: string;
  uploaded_by_name: string;
}

export interface WeeklyLogRecord {
  id: string;
  project: string;
  week_start_date: string;
  weather: string;
  crew_count: number;
  budget_used: string;
  notes: string;
  status: "DRAFT" | "SUBMITTED";
  site_officer_email: string;
  photo_ids?: string[];
  attached_photos?: PhotoRecord[];
}

export async function listLogs(projectId: string): Promise<WeeklyLogRecord[]> {
  const response = await api.get(`/api/weekly-logs/?project=${projectId}`);
  return response.data;
}

export async function createLog(
  data: Partial<WeeklyLogRecord>,
): Promise<WeeklyLogRecord> {
  const response = await api.post("/api/weekly-logs/", data);
  return response.data;
}

export async function submitLog(id: string): Promise<{ status: string }> {
  const response = await api.post(`/api/weekly-logs/${id}/submit/`);
  return response.data;
}

export async function exportPdf(
  id: string,
): Promise<{ task_id: string; message: string }> {
  const response = await api.post(`/api/weekly-logs/${id}/export-pdf/`);
  return response.data;
}
