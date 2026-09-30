import api from './api'

export const listAdminNotifications = (params) => api.get('/notifications/admin', { params })
export const createNotification = (data) => api.post('/notifications', data)
export const broadcastNotification = (data) => api.post('/notifications/broadcast', data)
