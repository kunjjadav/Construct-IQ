import api from "./axiosInstance";

export interface PhotoRecord {
  id: string;
  project: string;
  caption: string;
  image: string | null;
  s3_key: string;
  lat: number | null;
  lon: number | null;
  uploaded_by_name: string;
  uploaded_by_email: string;
  created_at: string;
}

export async function listPhotos(projectId: string): Promise<PhotoRecord[]> {
  const response = await api.get(`/api/photos/?project=${projectId}`);
  return response.data;
}

export async function uploadPhoto(
  projectId: string,
  file: File,
  caption: string,
  lat?: number,
  lng?: number,
): Promise<PhotoRecord> {
  const formData = new FormData();
  formData.append("project", projectId);
  formData.append("caption", caption);
  formData.append("file", file);

  if (lat !== undefined && lng !== undefined) {
    formData.append("lat", String(lat));
    formData.append("lon", String(lng));
  }

  const response = await api.post("/api/photos/", formData, {
    headers: {
      "Content-Type": undefined as unknown as string,
    },
  });
  return response.data;
}
