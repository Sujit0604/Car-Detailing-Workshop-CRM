import { ACCENT } from '../config/theme'

const STATUS_STYLES = {
  PENDING: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  CONFIRMED: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  VEHICLE_RECEIVED: { bg: 'rgba(6,182,212,0.12)', text: '#06b6d4' },
  IN_PROGRESS: { bg: 'rgba(217,79,61,0.12)', text: ACCENT },
  COMPLETED: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  CANCELLED: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280' },
  NO_SHOW: { bg: 'rgba(107,114,128,0.14)', text: '#9ca3af' },
  CREATED: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  CHECK_IN: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  INSPECTION: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  ESTIMATE_PENDING: { bg: 'rgba(249,115,22,0.12)', text: '#fb923c' },
  CUSTOMER_APPROVAL: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  APPROVED: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  ASSIGNED: { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8' },
  QUALITY_CHECK: { bg: 'rgba(139,92,246,0.12)', text: '#c084fc' },
  REWORK: { bg: 'rgba(217,79,61,0.14)', text: '#f87171' },
  READY: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  DELIVERED: { bg: 'rgba(16,185,129,0.12)', text: '#34d399' },
  REJECTED: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  ACTIVE: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  INACTIVE: { bg: 'rgba(107,114,128,0.12)', text: '#6b7280' },
  BLOCKED: { bg: 'rgba(217,79,61,0.14)', text: '#f87171' },
  TEMPORARILY_CLOSED: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  PENDING_VERIFICATION: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  PAID: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  PARTIAL: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  FAILED: { bg: 'rgba(217,79,61,0.14)', text: '#f87171' },
  REFUNDED: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  SUCCESS: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  PARTIALLY_REFUNDED: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  DRAFT: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  ISSUED: { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa' },
  PARTIALLY_PAID: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  VOID: { bg: 'rgba(107,114,128,0.14)', text: '#6b7280' },
  UNPAID: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  PUBLISHED: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  HIDDEN: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  FLAGGED: { bg: 'rgba(245,158,11,0.12)', text: '#fbbf24' },
  SENT: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  READ: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  GOOD: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  FAIR: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  POOR: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
  DAMAGED: { bg: 'rgba(217,79,61,0.14)', text: '#f87171' },
  REPLACE_REQUIRED: { bg: 'rgba(217,79,61,0.14)', text: '#f87171' },
  RESERVED: { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8' },
  USED: { bg: 'rgba(34,197,94,0.12)', text: '#22c55e' },
  RETURNED: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
  CUSTOMER: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6' },
  ADMIN: { bg: 'rgba(217,79,61,0.12)', text: ACCENT },
  WORKSHOP_MANAGER: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
  SERVICE_ADVISOR: { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
  MECHANIC: { bg: 'rgba(14,165,233,0.12)', text: '#38bdf8' },
}

export default function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.PENDING
  return (
    <span
      className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{
        background: s.bg,
        color: s.text,
        borderRadius: 2,
        fontFamily: "'Barlow', sans-serif",
        letterSpacing: '0.06em',
      }}
    >
      {String(status).replace(/_/g, ' ')}
    </span>
  )
}