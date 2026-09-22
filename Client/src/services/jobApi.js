import api from './api'

export const createJob = (data) => api.post('/jobs', data)
export const getJob = (id) => api.get(`/jobs/${id}`)
export const listJobs = (params) => api.get('/jobs', { params })
export const listWorkshopJobs = (workshopId, params) =>
  api.get(`/jobs/workshop/${workshopId}`, { params })
export const updateJobStatus = (id, data) => api.patch(`/jobs/${id}/status`, data)
export const checkInJob = (id, data) => api.post(`/jobs/${id}/check-in`, data)
export const assignMechanic = (id, data) => api.patch(`/jobs/${id}/assign-mechanic`, data)

export const createEstimate = (jobId, data) => api.post(`/jobs/${jobId}/estimate`, data)
export const getEstimate = (jobId) => api.get(`/jobs/${jobId}/estimate`)
export const respondToEstimate = (jobId, data) =>
  api.post(`/jobs/${jobId}/estimate/respond`, data)