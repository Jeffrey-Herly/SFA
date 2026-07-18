import api from './api';

export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  sent_email: boolean;
  sent_wa: boolean;
  created_at: string;
}

export const notificationsService = {
  async getNotifications() {
    const response = await api.get('/notifications');
    return response.data as NotificationData[];
  },

  async markAsRead(id: string) {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead() {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};
