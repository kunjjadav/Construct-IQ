import api from "./axiosInstance";

export interface ProjectMemberRecord {
  id: number;
  project: number;
  project_name: string;
  user: number;
  user_email: string;
  role: string;
  invited_at: string;
  accepted_at: string | null;
  is_frozen: boolean;
}

export async function addProjectMember(
  projectId: number | string,
  userId: number,
  role: "CLIENT" | "AGENT" | "SITE_OFFICER",
): Promise<ProjectMemberRecord> {
  const response = await api.post("/api/project-members/", {
    project: projectId,
    user: userId,
    role,
  });
  return response.data;
}

export async function removeProjectMember(memberId: number): Promise<void> {
  await api.delete(`/api/project-members/${memberId}/`);
}

export async function freezeProjectMember(
  memberId: number,
): Promise<ProjectMemberRecord> {
  const response = await api.post(`/api/project-members/${memberId}/freeze/`);
  return response.data;
}

export async function unfreezeProjectMember(
  memberId: number,
): Promise<ProjectMemberRecord> {
  const response = await api.post(`/api/project-members/${memberId}/unfreeze/`);
  return response.data;
}

export async function listProjectMembers(
  projectId: string | number,
): Promise<ProjectMemberRecord[]> {
  const response = await api.get(`/api/project-members/?project=${projectId}`);
  return response.data;
}
