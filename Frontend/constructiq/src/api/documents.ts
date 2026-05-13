import api from "./axiosInstance";

export interface DocumentRecord {
  id: string;
  project: number | string;
  project_name: string;
  title: string;
  s3_key: string;
  file_type: string;
  version: number;
  uploaded_by: number | string;
  uploaded_by_email: string;
  is_current: boolean;
  checksum: string;
  created_at: string;
}

export async function listDocuments(
  projectId: string,
  signal?: AbortSignal,
): Promise<DocumentRecord[]> {
  const response = await api.get(`/api/documents/?project=${projectId}`, {
    signal,
  });
  return response.data;
}

export async function uploadDocument(
  projectId: string | number,
  file: File,
  title: string,
  fileType?: string,
): Promise<DocumentRecord> {
  const formData = new FormData();
  formData.append("project", String(projectId));
  formData.append("title", title);
  formData.append("file", file);
  const detectedType =
    fileType || file.name.split(".").pop()?.toUpperCase() || "OTHER";
  formData.append("file_type", detectedType);

  const response = await api.post("/api/documents/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function downloadDocument(
  documentId: string,
  filename: string,
): Promise<void> {
  const response = await api.get(`/api/documents/${documentId}/download/`, {
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();

  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
