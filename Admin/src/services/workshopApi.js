import api from './api'

export const listWorkshops = (params) => api.get('/workshops', { params })
export const getWorkshop = (id) => api.get(`/workshops/${id}`)
export const createWorkshop = (data) => api.post('/workshops', data)
export const updateWorkshop = (id, data) => api.patch(`/workshops/${id}`, data)
export const deleteWorkshop = (id) => api.delete(`/workshops/${id}`)