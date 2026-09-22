export const ROLE_HOME = {
  CUSTOMER: '/dashboard',
  WORKSHOP_MANAGER: '/workshop/jobs',
  SERVICE_ADVISOR: '/workshop/jobs',
  MECHANIC: '/workshop/jobs',
  ADMIN: '/workshop/jobs',
}

export function getHomePath(role) {
  return ROLE_HOME[role] || '/dashboard'
}

export function getJobBackPath(role) {
  return role === 'CUSTOMER' ? '/bookings' : '/workshop/jobs'
}