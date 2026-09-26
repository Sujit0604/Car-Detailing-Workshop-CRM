import api from './api'

export const listInspections = (params) => api.get('/inspections', { params })

export const getInspection = (id) => api.get(`/inspections/${id}`)

export const createInspection = (data) => api.post('/inspections', data)

export const updateInspection = (id, data) => api.patch(`/inspections/${id}`, data)

export const completeInspection = (id) => api.post(`/inspections/${id}/complete`)
