import api from './api'

export const listWorkshops = (params) => api.get('/workshops', { params })
export const listServices = (params) => api.get('/services', { params })
export const listMechanics = (params) => api.get('/mechanics', { params })
export const getWorkshopOverview = (workshopId) => api.get(`/workshops/${workshopId}/overview`)