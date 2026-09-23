import api from './api'

export const getJob = (id) => api.get(`/jobs/${id}`)
export const createJob = (data) => api.post('/jobs', data)
export const updateJobStatus = (id, data) => api.patch(`/jobs/${id}/status`, data)
export const checkInJob = (id, data) => api.post(`/jobs/${id}/check-in`, data)
export const assignMechanic = (id, data) => api.patch(`/jobs/${id}/assign-mechanic`, data)