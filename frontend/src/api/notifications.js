import API from './axios';

// GET /api/notifications — get all notifications for logged-in user
export const getNotifications = () => API.get('/notifications');

// PATCH /api/notifications/:id/read — mark single notification as read
export const markNotificationRead = (id) => API.patch(`/notifications/${id}/read`);

// PATCH /api/notifications/read-all — mark all notifications as read
export const markAllNotificationsRead = () => API.patch('/notifications/read-all');