export const JOB_NEXT_STATUS = {
  CREATED: ['CHECK_IN', 'CANCELLED'],
  CHECK_IN: ['INSPECTION', 'CANCELLED'],
  INSPECTION: ['ESTIMATE_PENDING', 'REWORK', 'CANCELLED'],
  ESTIMATE_PENDING: ['CUSTOMER_APPROVAL', 'APPROVED', 'CANCELLED'],
  CUSTOMER_APPROVAL: ['APPROVED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'REWORK'],
  IN_PROGRESS: ['QUALITY_CHECK', 'REWORK', 'CANCELLED'],
  QUALITY_CHECK: ['READY', 'REWORK'],
  REWORK: ['IN_PROGRESS', 'QUALITY_CHECK', 'CANCELLED'],
  READY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
}

export const BOOKING_NEXT_STATUS = {
  PENDING: ['CONFIRMED', 'CANCELLED', 'NO_SHOW'],
  CONFIRMED: ['VEHICLE_RECEIVED', 'CANCELLED', 'NO_SHOW'],
  VEHICLE_RECEIVED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
}

export const BOOKING_PAYMENT_STATUSES = ['PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED']

export const USER_ROLES = [
  'CUSTOMER',
  'ADMIN',
  'WORKSHOP_MANAGER',
  'SERVICE_ADVISOR',
  'MECHANIC',
]

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED', 'PENDING_VERIFICATION']

export const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const formatDateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}