import api from './api'

export const listServiceCategories = (params) => api.get('/service-categories', { params })
export const getServiceCategory = (id) => api.get(`/service-categories/${id}`)
export const createServiceCategory = (data) => api.post('/service-categories', data)
export const updateServiceCategory = (id, data) => api.patch(`/service-categories/${id}`, data)
export const deleteServiceCategory = (id) => api.delete(`/service-categories/${id}`)