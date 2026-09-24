import api from './api'

export const getEstimate = (jobId) => api.get(`/jobs/${jobId}/estimate`)