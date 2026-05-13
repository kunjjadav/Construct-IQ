import api from "./axiosInstance";

export type NotificationType =
  | "RFI_ASSIGNED"
  | "RFI_ANSWERED"
  | "CO_PENDING"
  | "CO_APPROVED"
  | "MAINTENANCE_LOGGED"
  | "GENERAL_UPDATE"
  | "SYSTEM_ALERT";

export interface NotificationRecord {
  id: string;
  recipient: string | number;
  notification_type: NotificationType;
  message: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export async function listNotifications(): Promise<NotificationRecord[]> {
  const response = await api.get("/api/notifications/");
  return response.data;
}

export async function markRead(id: string): Promise<NotificationRecord> {
  const response = await api.patch(`/api/notifications/${id}/`, {
    is_read: true,
  });
  return response.data;
}

export async function markAllRead(): Promise<{
  success: boolean;
  modified_count: number;
}> {
  const response = await api.post("/api/notifications/mark-all-read/");
  return response.data;
}
