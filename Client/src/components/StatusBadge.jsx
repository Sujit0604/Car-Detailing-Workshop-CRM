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
      {status?.replace(/_/g, ' ')}
    </span>
  )
}