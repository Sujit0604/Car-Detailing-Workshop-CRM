import api from './api'

export const listReviews = (params) => api.get('/reviews', { params })
export const getReview = (id) => api.get(`/reviews/${id}`)
export const respondToReview = (id, data) => api.patch(`/reviews/${id}/response`, data)
export const moderateReview = (id, data) => api.patch(`/reviews/${id}/moderate`, data)
