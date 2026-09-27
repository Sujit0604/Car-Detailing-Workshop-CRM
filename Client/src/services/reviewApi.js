import api from './api'

export const listPublishedReviews = (params) => api.get('/reviews/published', { params })

export const createReview = (data) => api.post('/reviews', data)

export const listMyReviews = (params) => api.get('/reviews/mine', { params })

export const getReview = (id) => api.get(`/reviews/${id}`)

export const listReviews = (params) => api.get('/reviews', { params })

export const addReviewImage = (id, file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post(`/reviews/${id}/images`, formData)
}

export const removeReviewImage = (id, publicId) =>
  api.delete(`/reviews/${id}/images`, { params: { publicId } })

export const respondToReview = (id, message) => api.patch(`/reviews/${id}/response`, { message })

export const moderateReview = (id, data) => api.patch(`/reviews/${id}/moderate`, data)
