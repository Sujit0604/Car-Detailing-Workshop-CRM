import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Users, Building2, Sparkles, CalendarClock, ClipboardList, Wallet, ArrowUpRight } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import { getAdminStats } from '../../services/adminApi'
import { formatDate } from '../../utils/transitions'
import {
  ACCENT,
  FOREGROUND,
  MUTED,
  LINE_STRONG,
  PANEL,
  PANEL_ACTIVE,
  BACKGROUND,
} from '../../config/theme'

const BOOKING_STATUS_ORDER = [
  'PENDING',
  'CONFIRMED',
  'VEHICLE_RECEIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

function StatCard({ icon: Icon, label, value, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-4 p-5 text-left transition-colors duration-200 cursor-pointer"
      style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = PANEL_ACTIVE }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.background = PANEL }}
    >
      <div
        className="flex items-center justify-center w-12 h-12 shrink-0"
        style={{ background: 'rgba(217,79,61,0.10)' }}
      >
        <Icon size={22} style={{ color: ACCENT }} />
      </div>
      <div className="min-w-0">
        <p
          className="text-xs uppercase tracking-widest mb-1"
          style={{ color: MUTED, letterSpacing: '0.14em' }}
        >
          {label}
        </p>
        <div className="flex items-baseline gap-2">
          <span
            className="text-2xl font-black"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}
          >
            {value}
          </span>
          {sub && (
            <span className="text-xs" style={{ color: MUTED }}>
              {sub}
            </span>
          )}
        </div>
      </div>
      <ArrowUpRight size={16} className="ml-auto shrink-0" style={{ color: MUTED }} />
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getAdminStats()
      .then((res) => { if (!cancelled) setStats(res.data) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const breakdown = stats?.bookingStatusBreakdown || {}

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Dashboard
            </h1>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>
            Business overview across all workshops
          </p>
        </div>

        {loading || !stats ? (
          <Spinner label="Loading dashboard..." />
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats.users?.total || 0}
                sub={`${stats.users?.customers || 0} customers`}
                onClick={() => navigate('/users')}
              />
              <StatCard
                icon={Building2}
                label="Workshops"
                value={stats.workshops || 0}
                sub="registered"
                onClick={() => navigate('/workshops')}
              />
              <StatCard
                icon={Sparkles}
                label="Services"
                value={stats.services || 0}
                sub={`${stats.serviceCategories || 0} categories`}
                onClick={() => navigate('/services')}
              />
              <StatCard
                icon={Wallet}
                label="Revenue"
                value={`₹${(stats.revenue || 0).toLocaleString('en-IN')}`}
                sub="completed"
              />
            </section>

            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={CalendarClock}
                label="Active Bookings"
                value={stats.bookings?.active || 0}
                sub={`${stats.bookings?.total || 0} total`}
                onClick={() => navigate('/bookings')}
              />
              <StatCard
                icon={ClipboardList}
                label="Active Jobs"
                value={stats.jobs?.active || 0}
                sub={`${stats.jobs?.total || 0} total`}
                onClick={() => navigate('/jobs')}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Booking status breakdown */}
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
                <div className="px-5 py-4" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  <h2
                    className="text-lg font-black uppercase tracking-widest"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Booking Status
                  </h2>
                </div>
                <div className="p-5 space-y-3">
                  {BOOKING_STATUS_ORDER.map((status) => {
                    const count = breakdown[status] || 0
                    const total = stats.bookings?.total || 0
                    const pct = total ? Math.round((count / total) * 100) : 0
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1">
                          <StatusBadge status={status} />
                          <span className="text-xs font-bold" style={{ color: MUTED }}>
                            {count} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full" style={{ background: '#1e1e1e' }}>
                          <div
                            className="h-1.5"
                            style={{ width: `${pct}%`, background: ACCENT }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Recent bookings */}
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  <h2
                    className="text-lg font-black uppercase tracking-widest"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Recent Bookings
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigate('/bookings')}
                    className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors duration-200 cursor-pointer"
                    style={{ border: `1px solid ${LINE_STRONG}`, color: MUTED, background: 'transparent', fontFamily: "'Barlow Condensed', sans-serif" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
                  >
                    All
                  </button>
                </div>

                {(stats.recentBookings || []).length === 0 ? (
                  <EmptyState title="No bookings yet" message="Bookings across all workshops will appear here." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                          {['Booking', 'Vehicle', 'Workshop', 'Date', 'Amount', 'Status'].map((h) => (
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
                        {stats.recentBookings.map((b) => (
                          <tr
                            key={b._id}
                            className="transition-colors duration-150"
                            style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                                {b.bookingNumber}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                              {b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                              {b.workshopId?.name || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                              {formatDate(b.appointment?.date)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-sm font-bold" style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}>
                                ₹{(b.pricing?.total || 0).toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={b.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </section>
          </>
        )}
      </div>
    </div>
  )
}