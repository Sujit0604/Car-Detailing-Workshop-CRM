export const JOB_NEXT_STATUS = {
  CREATED: ['CHECK_IN', 'CANCELLED'],
  CHECK_IN: ['INSPECTION', 'CANCELLED'],
  INSPECTION: ['ESTIMATE_PENDING', 'REWORK', 'CANCELLED'],
  ESTIMATE_PENDING: ['CUSTOMER_APPROVAL', 'APPROVED', 'CANCELLED'],
  CUSTOMER_APPROVAL: ['APPROVED', 'ESTIMATE_PENDING', 'CANCELLED'],
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

// Mirrors Server/src/services/job.service.js ROLE_STATUS_PERMISSIONS.
// WORKSHOP_MANAGER supervises both mechanics (quality control) and
// service advisors, so they can drive every stage.
export const JOB_STATUS_ROLE_ALLOWED = {
  CHECK_IN: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  INSPECTION: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  ESTIMATE_PENDING: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  CUSTOMER_APPROVAL: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  APPROVED: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  ASSIGNED: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  IN_PROGRESS: ['MECHANIC', 'WORKSHOP_MANAGER', 'ADMIN'],
  QUALITY_CHECK: ['MECHANIC', 'WORKSHOP_MANAGER', 'ADMIN'],
  REWORK: ['MECHANIC', 'SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  READY: ['WORKSHOP_MANAGER', 'ADMIN'],
  DELIVERED: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  COMPLETED: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
  CANCELLED: ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN'],
}

export const getJobActionsForRole = (role, status) => {
  const next = JOB_NEXT_STATUS[status] || []
  return next.filter((s) => (JOB_STATUS_ROLE_ALLOWED[s] || []).includes(role))
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