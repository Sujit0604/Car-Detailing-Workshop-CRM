import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, Plus, Megaphone } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextInput, TextArea } from '../../components/Field'
import {
  listAdminNotifications,
  createNotification,
  broadcastNotification,
} from '../../services/notificationApi'
import { useAuth } from '../../contexts/authContext'
import { formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  ACCENT_HOVER,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  PANEL_ACTIVE,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../../config/theme'

const NOTIFICATION_TYPES = [
  'BOOKING_CONFIRMED',
  'BOOKING_CANCELLED',
  'JOB_STARTED',
  'JOB_COMPLETED',
  'ESTIMATE_READY',
  'ESTIMATE_APPROVED',
  'VEHICLE_READY',
  'PAYMENT_SUCCESS',
  'PAYMENT_FAILED',
  'INVOICE_ISSUED',
  'INVOICE_PAID',
  'REVIEW_RESPONSE',
  'REVIEW_UPDATED',
  'GENERAL',
]
const STATUS_FILTERS = ['ALL', 'SENT', 'READ']
const EMPTY_FORM = { userId: '', type: 'GENERAL', title: '', message: '', dedupeKey: '' }

const shortId = (value) => {
  const id = typeof value === 'object' && value ? value._id : value
  if (!id) return '—'
  return String(id).slice(-8)
}

export default function Notifications() {
  const { user } = useAuth()
  const canBroadcast = user?.role === 'ADMIN'

  const [notifications, setNotifications] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (status !== 'ALL') params.status = status
    if (type) params.type = type
    if (unreadOnly) params.unreadOnly = true

    let cancelled = false
    listAdminNotifications(params)
      .then((res) => {
        if (cancelled) return
        setNotifications(res.data?.notifications || [])
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
  }, [page, status, type, unreadOnly])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.userId.trim()) {
      toast.error('User id is required')
      return
    }
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      await createNotification({
        userId: form.userId.trim(),
        type: form.type,
        title: form.title.trim(),
        message: form.message || undefined,
        dedupeKey: form.dedupeKey.trim() || undefined,
      })
      toast.success('Notification sent')
      setCreateOpen(false)
      setPage(1)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleBroadcast = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const userIds = form.userId
        .split(/[\s,]+/)
        .map((id) => id.trim())
        .filter(Boolean)
      const res = await broadcastNotification({
        userIds: userIds.length ? userIds : undefined,
        type: form.type,
        title: form.title.trim(),
        message: form.message || undefined,
        dedupeKey: form.dedupeKey.trim() || undefined,
      })
      toast.success(`Broadcast queued for ${res.data?.createdCount ?? 0} recipient(s)`)
      setBroadcastOpen(false)
      setPage(1)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setCreateOpen(true)
  }

  const openBroadcast = () => {
    setForm(EMPTY_FORM)
    setBroadcastOpen(true)
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bell size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Notifications
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} notifications delivered across the platform
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canBroadcast && (
              <button
                type="button"
                onClick={openBroadcast}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={ghostButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
              >
                <Megaphone size={16} />
                Broadcast
              </button>
            )}
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Plus size={16} />
              Send Notification
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setStatus(f); setPage(1); setLoading(true) }}
              className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.1em',
                border: `1px solid ${status === f ? ACCENT : LINE_STRONG}`,
                color: status === f ? '#fff' : MUTED,
                background: status === f ? ACCENT : 'transparent',
              }}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectInput
            label="Type"
            value={type}
            placeholder="All types"
            onChange={(e) => { setType(e.target.value); setPage(1); setLoading(true) }}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: PANEL }}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectInput>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => { setUnreadOnly((v) => !v); setPage(1); setLoading(true) }}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{
                ...ghostButtonStyle,
                borderColor: unreadOnly ? ACCENT : LINE_STRONG,
                color: unreadOnly ? ACCENT : MUTED,
                background: unreadOnly ? 'rgba(217,79,61,0.08)' : 'transparent',
              }}
            >
              <Bell size={14} />
              Unread Only
            </button>
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications found" message="Notifications sent to users will appear here." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Title', 'Type', 'User', 'Message', 'Status', 'Sent', 'Read'].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                      style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr
                    key={n._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>{n.title}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: MUTED }}>{n.type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: MUTED }}>
                      {shortId(n.userId?._id || n.userId)}
                    </td>
                    <td className="px-5 py-3.5 text-sm max-w-xs" style={{ color: MUTED }}>{n.message || '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={n.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>{formatDateTime(n.sentAt)}</td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>{formatDateTime(n.readAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Send Notification" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-4" noValidate>
          <TextInput
            label="User Id"
            required
            value={form.userId}
            onChange={(e) => setForm((s) => ({ ...s, userId: e.target.value }))}
            placeholder="Recipient ObjectId"
          />
          <SelectInput
            label="Type"
            required
            value={form.type}
            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: PANEL }}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Title"
            required
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Your vehicle is ready for pickup"
          />
          <TextArea
            label="Message"
            rows={4}
            maxLength={2000}
            value={form.message}
            onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
            placeholder="Optional extra detail"
          />
          <TextInput
            label="Dedupe Key"
            value={form.dedupeKey}
            onChange={(e) => setForm((s) => ({ ...s, dedupeKey: e.target.value }))}
            placeholder="Optional — prevents duplicate delivery"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {saving ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={broadcastOpen} onClose={() => setBroadcastOpen(false)} title="Broadcast Notification" maxWidth="max-w-2xl">
        <form onSubmit={handleBroadcast} className="space-y-4" noValidate>
          <p className="text-sm" style={{ color: MUTED }}>
            Leave the user ids blank to notify every active user on the platform.
          </p>
          <TextArea
            label="User Ids"
            rows={3}
            value={form.userId}
            onChange={(e) => setForm((s) => ({ ...s, userId: e.target.value }))}
            placeholder="Comma or space separated ObjectIds"
          />
          <SelectInput
            label="Type"
            required
            value={form.type}
            onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t} value={t} style={{ background: PANEL }}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Title"
            required
            maxLength={150}
            value={form.title}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Scheduled maintenance reminder"
          />
          <TextArea
            label="Message"
            rows={4}
            maxLength={2000}
            value={form.message}
            onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
            placeholder="Optional extra detail"
          />
          <TextInput
            label="Dedupe Key"
            value={form.dedupeKey}
            onChange={(e) => setForm((s) => ({ ...s, dedupeKey: e.target.value }))}
            placeholder="Optional — prevents duplicate delivery"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setBroadcastOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {saving ? 'Broadcasting...' : 'Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
