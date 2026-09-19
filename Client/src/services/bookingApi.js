import api from './api'

export const createBooking = (data) => api.post('/bookings', data)
export const getBooking = (id) => api.get(`/bookings/${id}`)
export const listMyBookings = (params) => api.get('/bookings/mine', { params })
export const listWorkshopBookings = (workshopId, params) =>
  api.get(`/bookings/workshop/${workshopId}`, { params })
export const updateBookingStatus = (id, data) => api.patch(`/bookings/${id}/status`, data)
export const updateBookingPaymentStatus = (id, data) =>
  api.patch(`/bookings/${id}/payment-status`, data)
export const cancelBooking = (id, data) => api.post(`/bookings/${id}/cancel`, data)