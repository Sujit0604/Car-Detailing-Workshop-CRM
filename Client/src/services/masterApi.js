import api from './api'

// Master data endpoints. These become live once the corresponding
// backend modules (Workshop, Service, ServiceCategory, Mechanic) exist.
export const listWorkshops = (params) => api.get('/workshops', { params })
export const listServices = (params) => api.get('/services', { params })
export const listMechanics = (params) => api.get('/mechanics', { params })