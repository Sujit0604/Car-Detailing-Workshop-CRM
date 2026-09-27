import api from './api'

export const listJobParts = (jobId, params) => api.get(`/jobs/${jobId}/parts`, { params })

export const createJobPart = (jobId, data) => api.post(`/jobs/${jobId}/parts`, data)

export const updateJobPartStatus = (jobId, partId, data) =>
  api.patch(`/jobs/${jobId}/parts/${partId}/status`, data)

export const cancelJobPart = (jobId, partId, data) =>
  api.post(`/jobs/${jobId}/parts/${partId}/cancel`, data)

export const deleteJobPart = (jobId, partId) => api.delete(`/jobs/${jobId}/parts/${partId}`)
