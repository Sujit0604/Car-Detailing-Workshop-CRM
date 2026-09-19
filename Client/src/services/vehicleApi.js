import api from './api'

export const listVehicles = (params) => api.get('/vehicles', { params })
export const getVehicle = (id) => api.get(`/vehicles/${id}`)
export const createVehicle = (data) => api.post('/vehicles', data)
export const updateVehicle = (id, data) => api.patch(`/vehicles/${id}`, data)
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`)