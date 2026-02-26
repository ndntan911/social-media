import api from './api';

export const notificationAPI = {
  getNotifications: (page = 1, limit = 20) => 
    api.get(`/notifications?page=${page}&limit=${limit}`),

  markAsRead: (notificationId: string) => 
    api.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () => 
    api.put('/notifications/read-all'),

  getUnreadCount: () => 
    api.get<{ count: number }>('/notifications/unread-count'),
};
