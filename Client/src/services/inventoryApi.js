import api from './api'

export const listInventoryParts = (params) => api.get('/inventory', { params })
export const getInventoryPart = (id) => api.get(`/inventory/${id}`)
export const createInventoryPart = (data) => api.post('/inventory', data)
export const updateInventoryPart = (id, data) => api.patch(`/inventory/${id}`, data)
export const adjustStock = (id, data) => api.patch(`/inventory/${id}/stock`, data)
export const deleteInventoryPart = (id) => api.delete(`/inventory/${id}`)