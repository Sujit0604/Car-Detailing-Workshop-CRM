import api from './api'

export const createPaymentOrder = (invoiceId) => api.post('/payments/order', { invoiceId })

export const verifyPayment = (id, data) =>
  api.post(`/payments/${id}/verify`, {
    razorpayOrderId: data.razorpayOrderId,
    razorpayPaymentId: data.razorpayPaymentId,
    razorpaySignature: data.razorpaySignature,
  })

export const listMyPayments = (params) => api.get('/payments/mine', { params })

export const getPayment = (id) => api.get(`/payments/${id}`)

export const recordOfflinePayment = (data) => api.post('/payments', data)

export const refundPayment = (id, data) => api.post(`/payments/${id}/refund`, data)
