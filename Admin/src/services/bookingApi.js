import api from './api'

export const getBooking = (id) => api.get(`/bookings/${id}`)
export const updateBookingStatus = (id, data) => api.patch(`/bookings/${id}/status`, data)
export const updateBookingPaymentStatus = (id, data) =>
  api.patch(`/bookings/${id}/payment-status`, data)
export const cancelBooking = (id, data) => api.post(`/bookings/${id}/cancel`, data)