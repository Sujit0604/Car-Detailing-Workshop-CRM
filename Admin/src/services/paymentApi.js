import api from './api'

export const listPayments = (params) => api.get('/payments', { params })
export const getPayment = (id) => api.get(`/payments/${id}`)
export const recordOfflinePayment = (data) => api.post('/payments', data)
export const refundPayment = (id, data) => api.post(`/payments/${id}/refund`, data)
