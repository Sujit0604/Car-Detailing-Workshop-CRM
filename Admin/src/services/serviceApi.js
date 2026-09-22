import api from './api'

export const listServices = (params) => api.get('/services', { params })
export const getService = (id) => api.get(`/services/${id}`)
export const createService = (data) => api.post('/services', data)
export const updateService = (id, data) => api.patch(`/services/${id}`, data)
export const deleteService = (id) => api.delete(`/services/${id}`)