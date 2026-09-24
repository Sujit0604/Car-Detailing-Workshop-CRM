import api from './api'

export const uploadJobMedia = (jobId, file, category) => {
  const formData = new FormData()
  formData.append('image', file)
  formData.append('category', category)
  return api.post(`/media/jobs/${jobId}`, formData)
}

export const listJobMedia = (jobId) => api.get(`/media/jobs/${jobId}`)

export const deleteMedia = (id) => api.delete(`/media/${id}`)