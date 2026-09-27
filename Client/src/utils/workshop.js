// Workshop staff are posted to exactly one workshop, so their screens must not
// offer a workshop switcher. Admins and the mechanic list of assigned jobs keep
// working against whichever workshop is relevant.
const PINNED_ROLES = ['WORKSHOP_MANAGER', 'SERVICE_ADVISOR', 'MECHANIC']

export function getOwnWorkshopId(user) {
  if (!user || !PINNED_ROLES.includes(user.role)) return ''

  const id = user.workshopId

  if (!id) return ''

  return typeof id === 'object' ? id._id || '' : id
}
