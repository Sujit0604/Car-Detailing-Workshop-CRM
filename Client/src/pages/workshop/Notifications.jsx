import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Bell,
  BellOff,
  CheckCheck,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import {
  listMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/notificationApi'
import { useAuth } from '../../contexts/authContext'
import { formatDateTime } from '../../utils/transitions'
import { getHomePath } from '../../utils/routes'
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

const TYPE_ICONS = {
  BOOKING_CONFIRMED: 'BC',
  BOOKING_CANCELLED: 'BC',
  JOB_STARTED: 'JS',
  JOB_COMPLETED: 'JC',
  ESTIMATE_READY: 'ER',
  ESTIMATE_APPROVED: 'EA',
  VEHICLE_READY: 'VR',
  PAYMENT_SUCCESS: 'PS',
  PAYMENT_FAILED: 'PF',
  INVOICE_ISSUED: 'II',
  INVOICE_PAID: 'IP',
  REVIEW_RESPONSE: 'RR',
  REVIEW_UPDATED: 'RU',
  GENERAL: 'GN',
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isCustomer = user?.role === 'CUSTOMER'
  const backPath = getHomePath(user?.role)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [busyId, setBusyId] = useState(null)

  const load = async (params = {}) => {
    setError('')
    const [listRes, countRes] = await Promise.all([
      listMyNotifications({ limit: 50, ...params }),
      getUnreadCount(),
    ])
    setNotifications(listRes.data?.notifications || [])
    setUnreadCount(countRes.data?.count || 0)
  }

  useEffect(() => {
    let cancelled = false
    listMyNotifications({ limit: 50 })
      .then((res) => {
        if (cancelled) return
        setNotifications(res.data?.notifications || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    getUnreadCount()
      .then((res) => {
        if (!cancelled) setUnreadCount(res.data?.count || 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const handleToggleFilter = async (value) => {
    setUnreadOnly(value)
    try {
      const res = await listMyNotifications({ limit: 50, ...(value ? { unreadOnly: true } : {}) })
      setNotifications(res.data?.notifications || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const handleMarkRead = async (notification) => {
    if (notification.status === 'READ') return
    setBusyId(notification._id)
    try {
      await markNotificationRead(notification._id)
      setNotifications((items) =>
        items.map((item) =>
          item._id === notification._id ? { ...item, status: 'READ', readAt: new Date().toISOString() } : item,
        ),
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead()
      toast.success('All notifications marked as read')
      await load(unreadOnly ? { unreadOnly: true } : {})
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={14} />
          Back
        </button>

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
              {unreadCount > 0 && (
                <span
                  className="px-2.5 py-1 text-[11px] font-black uppercase tracking-wider"
                  style={{ background: 'rgba(217,79,61,0.15)', color: ACCENT, borderRadius: 2 }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {isCustomer
                ? 'Updates about your bookings, jobs, estimates, invoices and reviews will appear here.'
                : `Booking, job, estimate, payment and review updates for ${user?.name || 'your account'}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleToggleFilter(!unreadOnly)}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={{
                ...ghostButtonStyle,
                color: unreadOnly ? ACCENT : MUTED,
                borderColor: unreadOnly ? ACCENT : LINE_STRONG,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = unreadOnly ? ACCENT : LINE_STRONG
                e.currentTarget.style.color = unreadOnly ? ACCENT : MUTED
              }}
            >
              {unreadOnly ? <Bell size={14} /> : <BellOff size={14} />}
              {unreadOnly ? 'Unread only' : 'All'}
            </button>
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <CheckCheck size={14} />
              Mark All Read
            </button>
          </div>
        </div>

        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <Spinner label="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={unreadOnly ? 'Nothing unread' : 'No notifications yet'}
            message={
              unreadOnly
                ? 'You are all caught up. Switch back to all notifications to see your history.'
                : 'Updates about bookings, jobs, estimates, invoices and reviews will appear here.'
            }
          />
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const isUnread = notification.status !== 'READ'
              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleMarkRead(notification)}
                  disabled={busyId === notification._id}
                  className="w-full flex items-start gap-4 px-5 py-4 text-left cursor-pointer transition-colors duration-200 disabled:opacity-60"
                  style={{
                    border: `1px solid ${isUnread ? ACCENT : LINE_STRONG}`,
                    background: isUnread ? PANEL_ACTIVE : PANEL,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = PANEL_ACTIVE)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = isUnread ? PANEL_ACTIVE : PANEL)
                  }
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 shrink-0 text-[11px] font-black"
                    style={{ background: 'rgba(217,79,61,0.1)', color: ACCENT }}
                  >
                    {TYPE_ICONS[notification.type] || 'GN'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>
                        {notification.title}
                      </p>
                      <StatusBadge status={notification.status} />
                    </div>
                    {notification.message && (
                      <p className="text-sm mt-1" style={{ color: MUTED }}>{notification.message}</p>
                    )}
                    <p className="text-[11px] mt-1.5 uppercase tracking-widest" style={{ color: MUTED }}>
                      {String(notification.type || 'GENERAL').replace(/_/g, ' ')} ·{' '}
                      {formatDateTime(notification.readAt || notification.sentAt || notification.createdAt)}
                    </p>
                  </div>

                  {isUnread && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 mt-2"
                      style={{ background: ACCENT }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
