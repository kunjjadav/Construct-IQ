import api from "./axiosInstance";
import type { Project } from "../store/useProjectStore";
import type { TimelineDataPoint } from "../components/charts/SpendTimeline";
import type { CostCategory } from "../components/charts/CostBreakdownDonut";

export async function listProjects(signal?: AbortSignal): Promise<Project[]> {
  const response = await api.get("/api/projects/", { signal });
  return response.data;
}

export async function getProject(id: string): Promise<Project> {
  const response = await api.get(`/api/projects/${id}/`);
  return response.data;
}

export async function createProject(data: Partial<Project> & Record<string, any>): Promise<Project> {
  const response = await api.post("/api/projects/", data);
  return response.data;
}

export async function updateProject(
  id: string,
  data: Partial<Project>,
): Promise<Project> {
  const response = await api.patch(`/api/projects/${id}/`, data);
  return response.data;
}

export async function getFinancials(
  projectId: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const response = await api.get(`/api/projects/${projectId}/financials/`, {
    signal,
  });
  return response.data;
}

export async function getCostBreakdown(
  projectId: string,
): Promise<CostCategory[]> {
  const response = await api.get(`/api/projects/${projectId}/cost-breakdown/`);
  return response.data;
}

export async function getBudgetVsActuals(
  projectId: string,
): Promise<TimelineDataPoint[]> {
  const response = await api.get(
    `/api/projects/${projectId}/budget-vs-actuals/`,
  );
  return response.data;
}

export async function getSchedule(
  projectId: string,
): Promise<Record<string, unknown>> {
  const response = await api.get(`/api/projects/${projectId}/schedule/`);
  return response.data;
}

export async function approveProject(id: string): Promise<Project> {
  const response = await api.post(`/api/projects/${id}/approve/`);
  return response.data;
}
