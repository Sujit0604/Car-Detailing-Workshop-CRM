import api from './api'

export const listJobTasks = (jobId, params) => api.get(`/jobs/${jobId}/tasks`, { params })
export const createJobTask = (jobId, data) => api.post(`/jobs/${jobId}/tasks`, data)
export const updateJobTask = (jobId, taskId, data) => api.patch(`/jobs/${jobId}/tasks/${taskId}`, data)
export const updateJobTaskStatus = (jobId, taskId, data) =>
  api.patch(`/jobs/${jobId}/tasks/${taskId}/status`, data)
export const deleteJobTask = (jobId, taskId) => api.delete(`/jobs/${jobId}/tasks/${taskId}`)
