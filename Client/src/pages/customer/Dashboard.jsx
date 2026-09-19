import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Car,
  Wrench,
  CalendarCheck,
  Wallet,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  Gauge,
  Link2,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import { listVehicles } from '../../services/vehicleApi'
import { listMyBookings } from '../../services/bookingApi'
import {
  ACCENT,
  FOREGROUND,
  MUTED,
  LINE_STRONG,
  PANEL,
  PANEL_ACTIVE,
  BACKGROUND,
} from '../../config/theme'

const PIPELINE = ['PENDING', 'CONFIRMED', 'VEHICLE_RECEIVED', 'IN_PROGRESS', 'COMPLETED']
const ENDED_STATUSES = ['CANCELLED', 'NO_SHOW', 'COMPLETED']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div
      className="flex items-center gap-4 p-5 transition-colors duration-200"
      style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
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
    </div>
  )
}

function QuickAction({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-4 p-4 cursor-pointer transition-all duration-200 w-full text-left"
      style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = ACCENT
        e.currentTarget.style.background = PANEL_ACTIVE
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = LINE_STRONG
        e.currentTarget.style.background = PANEL
      }}
    >
      <div
        className="flex items-center justify-center w-10 h-10 shrink-0"
        style={{ background: 'rgba(217,79,61,0.08)' }}
      >
        <Icon size={18} style={{ color: ACCENT }} />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
        >
          {label}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: MUTED }}>
          {desc}
        </p>
      </div>
      <ChevronRight size={16} className="shrink-0" style={{ color: ACCENT }} />
    </button>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [vehRes, bookRes] = await Promise.allSettled([
          listVehicles({ limit: 100 }),
          listMyBookings({ limit: 50 }),
        ])
        setVehicles(vehRes.status === 'fulfilled' ? vehRes.value.data?.vehicles || [] : [])
        setBookings(bookRes.status === 'fulfilled' ? bookRes.value.data?.bookings || [] : [])
      } catch (err) {
        toast.error(err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const activeBookings = bookings.filter((b) => !ENDED_STATUSES.includes(b.status))
  const completedBookings = bookings.filter((b) => b.status === 'COMPLETED')
  const totalSpent = completedBookings.reduce((sum, b) => sum + (b.pricing?.total || 0), 0)
  const activeBooking = activeBookings[0] || null
  const activeStage = activeBooking
    ? Math.min(PIPELINE.indexOf(activeBooking.status), PIPELINE.length - 1)
    : 0

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      {loading ? (
        <div className="py-20">
          <Spinner label="Loading dashboard..." />
        </div>
      ) : (
        <div className="px-4 sm:px-8 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Car} label="My Vehicles" value={vehicles.length} sub="registered" />
              <StatCard icon={Wrench} label="Active Bookings" value={activeBookings.length} sub="in service" />
              <StatCard icon={CalendarCheck} label="Total Bookings" value={bookings.length} sub="all time" />
              <StatCard icon={Wallet} label="Total Spent" value={`₹${(totalSpent || 0).toLocaleString('en-IN')}`} sub="completed" />
            </section>

            {/* Active booking progress */}
            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                <div>
                  <h2
                    className="text-lg font-black uppercase tracking-widest"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                  >
                    Service Status
                  </h2>
                  <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                    {activeBooking
                      ? `${activeBooking.bookingNumber} · ${activeBooking.vehicleId?.make || ''} ${activeBooking.vehicleId?.model || 'Vehicle'} · ${(activeBooking.services || [])[0]?.serviceName || 'Service'}`
                      : 'No active service in progress'}
                  </p>
                </div>
                {activeBooking && (
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    <Clock size={13} style={{ color: ACCENT }} />
                    {formatDate(activeBooking.appointment?.date)} · {activeBooking.appointment?.startTime || '—'}
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between">
                {PIPELINE.map((stage, i) => {
                  const done = i < activeStage
                  const current = i === activeStage
                  return (
                    <div key={stage} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className="flex items-center justify-center w-8 h-8 rounded-full border-2"
                          style={{
                            borderColor: done || current ? ACCENT : LINE_STRONG,
                            background: done || current ? 'rgba(217,79,61,0.12)' : 'transparent',
                          }}
                        >
                          {done ? (
                            <CheckCircle2 size={16} style={{ color: ACCENT }} />
                          ) : current ? (
                            <span className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
                          ) : (
                            <span className="w-2 h-2 rounded-full" style={{ background: LINE_STRONG }} />
                          )}
                        </div>
                        <span
                          className="mt-2 text-[11px] uppercase tracking-wide text-center leading-tight max-w-[90px]"
                          style={{
                            color: current ? ACCENT : done ? FOREGROUND : MUTED,
                            fontFamily: "'Barlow', sans-serif",
                            fontWeight: current ? 700 : 400,
                          }}
                        >
                          {stage.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {i < PIPELINE.length - 1 && (
                        <div
                          className="flex-1 mt-4 mx-1.5 hidden sm:block"
                          style={{ height: 2, background: i < activeStage ? ACCENT : LINE_STRONG }}
                        />
                      )}
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
                  All Bookings
                </button>
              </div>

              {bookings.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title="No bookings yet"
                  message="Book your first detailing service to see it here."
                />
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
                      {bookings.slice(0, 8).map((b) => (
                        <tr
                          key={b._id}
                          onClick={() => navigate('/bookings')}
                          className="transition-colors duration-150 cursor-pointer"
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

            {/* My vehicles */}
            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                <h2
                  className="text-lg font-black uppercase tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  My Vehicles
                </h2>
                <button
                  type="button"
                  onClick={() => navigate('/vehicles')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest cursor-pointer"
                  style={{ color: ACCENT, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  <Plus size={14} />
                  Manage Vehicles
                </button>
              </div>

              {vehicles.length === 0 ? (
                <EmptyState
                  icon={Car}
                  title="No vehicles registered"
                  message="Add a vehicle to get started."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                  {vehicles.slice(0, 6).map((v) => (
                    <div
                      key={v._id}
                      className="p-4 transition-colors duration-200"
                      style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10" style={{ background: 'rgba(217,79,61,0.10)' }}>
                            <Car size={20} style={{ color: ACCENT }} />
                          </div>
                          <div>
                            <p className="text-base font-black uppercase tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}>
                              {v.manufacturingYear} {v.make} {v.model}
                            </p>
                            <p className="text-xs" style={{ color: MUTED }}>
                              {v.variant || 'Standard'} · {v.fuelType}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs" style={{ color: MUTED }}>
                        <div className="flex items-center justify-between">
                          <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Reg. No.</span>
                          <span className="font-semibold tracking-wider" style={{ color: FOREGROUND }}>{v.registrationNumber}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Gearbox</span>
                          <span style={{ color: FOREGROUND }}>{v.transmission}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Odometer</span>
                          <span className="flex items-center gap-1.5" style={{ color: FOREGROUND }}>
                            <Gauge size={12} style={{ color: ACCENT }} />
                            {v.odometer?.toLocaleString() || '—'} km
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Quick actions */}
            <section>
              <h2
                className="text-lg font-black uppercase tracking-widest mb-4"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <QuickAction icon={Wrench} label="Book a Service" desc="Schedule your next detail" onClick={() => navigate('/book-service')} />
                <QuickAction icon={Car} label="Add a Vehicle" desc="Register a new car" onClick={() => navigate('/vehicles')} />
                <QuickAction icon={CalendarCheck} label="View Bookings" desc="Track past and active jobs" onClick={() => navigate('/bookings')} />
                <QuickAction icon={Link2} label="Manage Vehicles" desc="Edit or remove a vehicle" onClick={() => navigate('/vehicles')} />
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}