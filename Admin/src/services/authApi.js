import api from './api'

export const loginUser = (data) => api.post('/auth/login', data)
export const verifyOtp = (data) => api.post('/auth/verify-otp', data)
export const refreshToken = (data) => api.post('/auth/refresh', data)
export const logoutUser = (data) => api.post('/auth/logout', data)