import api from './api'

export const listMechanics = (params) => api.get('/mechanics', { params })