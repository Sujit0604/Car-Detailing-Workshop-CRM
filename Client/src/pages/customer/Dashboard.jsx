import {
  Car,
  Wrench,
  CreditCard,
  FileText,
  Star,
  Plus,
  ChevronRight,
  Clock,
  Wallet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  Download,
  Gauge,
  Sparkles,
} from 'lucide-react'
import {
  ACCENT,
  ACCENT_HOVER,
  FOREGROUND,
  MUTED,
  LINE_STRONG,
  PANEL,
  PANEL_ACTIVE,
  BACKGROUND,
} from '../../config/theme'

const CUSTOMER = {
  name: 'James Wilson',
  plan: 'Signature Member',
  memberSince: 'Mar 2024',
}

const PIPELINE_STAGES = [
  'Booking Confirmed',
  'Vehicle Received',
  'Estimate Approved',
  'Repair In Progress',
  'Quality Check',
  'Delivered',
]

const ACTIVE_STAGE = 3

const ACTIVE_BOOKING = {
  id: 'BK-2389',
  vehicle: 'BMW 5 Series',
  service: 'Ceramic & Graphene Coating',
  workshop: 'KROM DETAIL · Andheri East',
  date: 'Sep 15, 2026',
  eta: 'Sep 17, 2026 · 6:00 PM',
}

const PENDING_ESTIMATE = {
  booking: 'BK-2389',
  vehicle: 'BMW 5 Series',
  amount: '$1,250.00',
  estimateId: 'EST-4502',
  raisedOn: 'Sep 14, 2026',
}

const VEHICLES = [
  {
    id: 'V-1001',
    make: 'BMW',
    model: '5 Series',
    year: 2021,
    color: 'Alpine White',
    plate: 'MH12 AB 1234',
    lastService: 'Sep 02, 2026',
    bookings: 4,
  },
  {
    id: 'V-1002',
    make: 'Audi',
    model: 'Q5 Premium Plus',
    year: 2022,
    color: 'Mythos Black',
    plate: 'MH01 CD 5678',
    lastService: 'Jun 18, 2026',
    bookings: 2,
  },
  {
    id: 'V-1003',
    make: 'Ford',
    model: 'Mustang GT',
    year: 2023,
    color: 'Race Red',
    plate: 'MH14 EF 9012',
    lastService: 'Aug 25, 2026',
    bookings: 1,
  },
]

const MY_BOOKINGS = [
  { id: 'BK-2389', vehicle: 'BMW 5 Series', service: 'Ceramic & Graphene Coating', workshop: 'Andheri East', date: 'Sep 15, 2026', amount: '$1,250', status: 'In Progress' },
  { id: 'BK-2361', vehicle: 'Audi Q5',       service: 'Detailing & Deep Clean',     workshop: 'Andheri East', date: 'Sep 02, 2026', amount: '$299',   status: 'Completed' },
  { id: 'BK-2340', vehicle: 'Ford Mustang',  service: 'Paint Protection Film',     workshop: 'Bandra West',  date: 'Aug 25, 2026', amount: '$2,100', status: 'Completed' },
  { id: 'BK-2322', vehicle: 'BMW 5 Series',  service: 'Panel Painting',            workshop: 'Andheri East', date: 'Aug 08, 2026', amount: '$1,650', status: 'Completed' },
  { id: 'BK-2298', vehicle: 'Audi Q5',       service: 'Full Body Painting',        workshop: 'Bandra West',  date: 'Jul 19, 2026', amount: '$3,800', status: 'Cancelled' },
]

const STATUS_COLORS = {
  'Pending':          { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  'Confirmed':        { bg: 'rgba(59,130,246,0.12)',   text: '#3b82f6' },
  'In Progress':      { bg: 'rgba(217,79,61,0.12)',    text: ACCENT },
  'Quality Check':    { bg: 'rgba(139,92,246,0.12)',   text: '#8b5cf6' },
  'Completed':        { bg: 'rgba(16,185,129,0.12)',   text: '#10b981' },
  'Cancelled':        { bg: 'rgba(107,114,128,0.12)',  text: '#6b7280' },
  'Estimate':         { bg: 'rgba(251,191,36,0.12)',   text: '#fbbf24' },
  'Pending Approval': { bg: 'rgba(249,115,22,0.12)',   text: '#f97316' },
  'Vehicle Received': { bg: 'rgba(6,182,212,0.12)',    text: '#06b6d4' },
  'Approved':         { bg: 'rgba(34,197,94,0.12)',    text: '#22c55e' },
  'Ready to Pick Up': { bg: 'rgba(59,130,246,0.12)',   text: '#3b82f6' },
  'Delivered':        { bg: 'rgba(16,185,129,0.12)',   text: '#10b981' },
}

const QUICK_ACTIONS = [
  { icon: Wrench,      label: 'Book a Service',     desc: 'Schedule your next detail' },
  { icon: Car,         label: 'Add a Vehicle',      desc: 'Register a new car' },
  { icon: FileText,    label: 'Approve Estimate',   desc: 'Review pending estimate' },
  { icon: CreditCard,  label: 'Make Payment',       desc: 'Pay outstanding invoice' },
  { icon: Download,    label: 'Download Invoice',   desc: 'View billing history' },
  { icon: Star,        label: 'Leave a Review',     desc: 'Rate your experience' },
]

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

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS['Pending']
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
      {status}
    </span>
  )
}

function PipelineTracker({ stages, activeStage }) {
  return (
    <div className="flex items-start justify-between">
      {stages.map((stage, i) => {
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
                  letterSpacing: '0.06em',
                }}
              >
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div
                className="flex-1 mt-4 mx-1.5 hidden sm:block"
                style={{
                  height: 2,
                  background: i < activeStage ? ACCENT : LINE_STRONG,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function ActionCard({ icon: Icon, label, desc }) {
  return (
    <div
      className="group flex items-center gap-4 p-4 cursor-pointer transition-all duration-200"
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
    </div>
  )
}

export default function Dashboard() {
  const activeBookings = MY_BOOKINGS.filter((b) => !['Completed', 'Cancelled'].includes(b.status)).length
  const totalSpent = MY_BOOKINGS.filter((b) => b.status === 'Completed').length * 1450
  const currentStage = Math.max(0, Math.min(ACTIVE_STAGE, PIPELINE_STAGES.length - 1))

  return (
    <div
      className="min-h-screen"
      style={{ background: BACKGROUND, color: FOREGROUND }}
    >
      {/* Header */}
      <div
        className="px-6 md:px-10 py-8"
        style={{ borderBottom: `1px solid ${LINE_STRONG}`, background: PANEL }}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl md:text-4xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Dashboard
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Welcome back, {CUSTOMER.name}{' '}
              <span style={{ color: ACCENT }}>·</span> {CUSTOMER.plan} member since {CUSTOMER.memberSince}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={{
              background: ACCENT,
              color: '#fff',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.16em',
              border: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <Plus size={16} />
            Book a Service
          </button>
        </div>
      </div>

      <div className="px-6 md:px-10 py-8 space-y-8">

        {/* KPI Stat Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Car}    label="My Vehicles"    value={VEHICLES.length} sub="registered" />
          <StatCard icon={Wrench} label="Active Bookings" value={activeBookings}  sub="in service" />
          <StatCard icon={CalendarCheck} label="Total Bookings" value={MY_BOOKINGS.length} sub="all time" />
          <StatCard icon={Wallet} label="Total Spent"    value={`$${totalSpent.toLocaleString()}`} sub="completed" />
        </section>

        {/* Active Booking Progress */}
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
                {ACTIVE_BOOKING.id} · {ACTIVE_BOOKING.vehicle} · {ACTIVE_BOOKING.service}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>
              <span className="flex items-center gap-1.5">
                <Clock size={13} style={{ color: ACCENT }} />
                ETA {ACTIVE_BOOKING.eta}
              </span>
            </div>
          </div>
          <PipelineTracker stages={PIPELINE_STAGES} activeStage={currentStage} />
        </section>

        {/* Pending Estimate Approval */}
        <section
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5"
          style={{ border: `1px solid ${ACCENT}`, background: 'rgba(217,79,61,0.06)' }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex items-center justify-center w-10 h-10 shrink-0"
              style={{ background: 'rgba(217,79,61,0.12)' }}
            >
              <AlertCircle size={20} style={{ color: ACCENT }} />
            </div>
            <div>
              <p
                className="text-sm font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
              >
                Estimate ready for approval
              </p>
              <p className="text-sm mt-1" style={{ color: MUTED }}>
                {PENDING_ESTIMATE.vehicle} · {PENDING_ESTIMATE.booking} · Raised {PENDING_ESTIMATE.raisedOn} — total{' '}
                <span className="font-bold" style={{ color: FOREGROUND }}>{PENDING_ESTIMATE.amount}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>
                Reference: {PENDING_ESTIMATE.estimateId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{ background: ACCENT, color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em', border: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <CheckCircle2 size={14} />
              Approve
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{ border: `1px solid ${LINE_STRONG}`, color: MUTED, background: 'transparent', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.14em' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              <XCircle size={14} />
              Reject
            </button>
          </div>
        </section>

        {/* Recent Bookings */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
            <h2
              className="text-lg font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              My Bookings
            </h2>
            <button
              type="button"
              className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 transition-colors duration-200 cursor-pointer"
              style={{ border: `1px solid ${LINE_STRONG}`, color: MUTED, background: 'transparent', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              All Bookings
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Booking', 'Vehicle', 'Service', 'Workshop', 'Date', 'Amount', 'Status'].map((h) => (
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
                {MY_BOOKINGS.map((b) => (
                  <tr
                    key={b.id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {b.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {b.vehicle}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {b.service}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {b.workshop}
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {b.date}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {b.amount}
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
        </section>

        {/* My Vehicles */}
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
              className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest cursor-pointer"
              style={{ color: ACCENT, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              <Plus size={14} />
              Add Vehicle
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
            {VEHICLES.map((v) => (
              <div
                key={v.id}
                className="p-4 transition-colors duration-200"
                style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10"
                      style={{ background: 'rgba(217,79,61,0.10)' }}
                    >
                      <Car size={20} style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p
                        className="text-base font-black uppercase tracking-wide"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}
                      >
                        {v.year} {v.make} {v.model}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {v.color} · {v.id}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs" style={{ color: MUTED }}>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>Reg. No.</span>
                    <span
                      className="font-semibold tracking-wider"
                      style={{ color: FOREGROUND, fontFamily: "'Barlow', sans-serif" }}
                    >
                      {v.plate}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>Last Serviced</span>
                    <span style={{ color: FOREGROUND }}>{v.lastService}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>Services Done</span>
                    <span className="flex items-center gap-1.5" style={{ color: FOREGROUND }}>
                      <Gauge size={12} style={{ color: ACCENT }} />
                      {v.bookings} bookings
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2
            className="text-lg font-black uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
          >
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {QUICK_ACTIONS.map((action) => (
              <ActionCard key={action.label} {...action} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}