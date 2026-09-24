import api from './api'

export const getAdminStats = () => api.get('/admin/stats')
export const listUsers = (params) => api.get('/admin/users', { params })
export const createStaffUser = (data) => api.post('/admin/users', data)
export const updateUserStatus = (id, data) => api.patch(`/admin/users/${id}/status`, data)
export const updateUserRole = (id, data) => api.patch(`/admin/users/${id}/role`, data)
export const assignUserWorkshop = (id, data) => api.patch(`/admin/users/${id}/workshop`, data)
export const listAllBookings = (params) => api.get('/admin/bookings', { params })
export const listAllJobs = (params) => api.get('/admin/jobs', { params })