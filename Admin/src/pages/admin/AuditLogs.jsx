import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ScrollText, ChevronDown, ChevronRight } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import { SelectInput, TextInput } from '../../components/Field'
import { listAuditLogs } from '../../services/auditApi'
import { formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  PANEL_ACTIVE,
  ghostButtonStyle,
} from '../../config/theme'

const SORT_OPTIONS = ['createdAt', 'action', 'entityType']
const ENTITY_TYPES = [
  'BOOKING',
  'JOB',
  'USER',
  'WORKSHOP',
  'INVENTORY',
  'ESTIMATE',
  'INVOICE',
  'PAYMENT',
  'REVIEW',
  'NOTIFICATION',
  'MECHANIC',
  'JOB_TASK',
  'JOB_PART',
  'INSPECTION',
]

const shortId = (value) => {
  if (!value) return '—'
  return String(value).slice(-8)
}

const stringify = (value) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') {
    const keys = Object.keys(value)
    if (keys.length === 0) return '{}'
  }
  return JSON.stringify(value, null, 2)
}

function DiffBlock({ label, value, tone }) {
  const text = stringify(value)
  return (
    <div className="flex-1 min-w-0">
      <p
        className="text-[10px] uppercase tracking-widest mb-1"
        style={{ color: tone, fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {label}
      </p>
      <pre
        className="text-[11px] leading-relaxed overflow-x-auto p-3 whitespace-pre-wrap break-words"
        style={{ border: `1px solid ${LINE_STRONG}`, background: '#0a0a0a', color: FOREGROUND }}
      >
        {text}
      </pre>
    </div>
  )
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    const params = { page, limit: 20, sortBy, sortOrder: 'desc' }
    if (action.trim()) params.action = action.trim()
    if (entityType) params.entityType = entityType
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    let cancelled = false
    listAuditLogs(params)
      .then((res) => {
        if (cancelled) return
        setLogs(res.data?.auditLogs || [])
        setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
      })
      .catch((err) => {
        if (!cancelled) toast.error(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [page, action, entityType, fromDate, toDate, sortBy])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const toggle = (id) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ScrollText size={22} style={{ color: ACCENT }} />
            <h1
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Audit Logs
            </h1>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>
            {pagination.total} recorded system changes
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <TextInput
            label="Action"
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); setLoading(true) }}
            placeholder="e.g. JOB_STATUS_UPDATED"
          />
          <SelectInput
            label="Entity Type"
            value={entityType}
            placeholder="All entities"
            onChange={(e) => { setEntityType(e.target.value); setPage(1); setLoading(true) }}
          >
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: PANEL }}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); setLoading(true) }}
          />
          <TextInput
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); setLoading(true) }}
          />
          <SelectInput
            label="Sort By"
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); setLoading(true) }}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s} value={s} style={{ background: PANEL }}>
                {s.replace(/([A-Z])/g, ' $1')}
              </option>
            ))}
          </SelectInput>
        </div>

        {loading ? (
          <Spinner />
        ) : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No audit entries found" message="System changes will be recorded here as they happen." />
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const isOpen = !!expanded[log._id]
              const hasDiff =
                (log.oldValue && Object.keys(log.oldValue).length > 0) ||
                (log.newValue && Object.keys(log.newValue).length > 0) ||
                (log.metadata && Object.keys(log.metadata).length > 0)

              return (
                <section key={log._id} style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
                  <button
                    type="button"
                    onClick={() => hasDiff && toggle(log._id)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 cursor-pointer"
                    style={hasDiff ? undefined : { cursor: 'default' }}
                    onMouseEnter={(e) => { if (hasDiff) e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span className="shrink-0" style={{ color: hasDiff ? MUTED : 'transparent' }}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-sm font-bold"
                          style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {log.action}
                        </span>
                        {log.entityType && <StatusBadge status={log.entityType} />}
                        <span className="text-xs" style={{ color: MUTED }}>
                          {shortId(log.entityId)}
                        </span>
                      </span>
                      <span className="block text-xs mt-1" style={{ color: MUTED }}>
                        {log.actorName || log.actorEmail || 'System'}
                        {log.actorRole ? ` · ${log.actorRole}` : ''}
                      </span>
                    </span>
                    <span className="text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDateTime(log.createdAt)}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${LINE_STRONG}` }}>
                      <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {[
                          ['Request Id', log.requestId],
                          ['Route', log.path ? `${log.method || ''} ${log.path}`.trim() : null],
                          ['IP Address', log.ipAddress],
                          ['User Agent', log.userAgent],
                        ].map(([label, value]) => (
                          <div key={label} className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                              {label}
                            </span>
                            <span className="break-words" style={{ color: FOREGROUND }}>{value || '—'}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <DiffBlock label="Before" value={log.oldValue} tone="#f87171" />
                        <DiffBlock label="After" value={log.newValue} tone="#10b981" />
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <DiffBlock label="Metadata" value={log.metadata} tone={MUTED} />
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={ghostButtonStyle}
            >
              Prev
            </button>
            <span className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>
              Page {page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => goToPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={ghostButtonStyle}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
