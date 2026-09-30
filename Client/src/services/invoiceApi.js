import api from './api'

export const listMyInvoices = (params) => api.get('/invoices/mine', { params })

export const getInvoice = (id) => api.get(`/invoices/${id}`)

export const listInvoices = (params) => api.get('/invoices', { params })

export const generateInvoice = (data) => api.post('/invoices', data)

export const issueInvoice = (id, data) => api.patch(`/invoices/${id}/issue`, data)

export const voidInvoice = (id, data) => api.patch(`/invoices/${id}/void`, data)
