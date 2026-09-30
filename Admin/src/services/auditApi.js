import api from './api'

export const listAuditLogs = (params) => api.get('/audit-logs', { params })
export const getAuditLog = (id) => api.get(`/audit-logs/${id}`)
