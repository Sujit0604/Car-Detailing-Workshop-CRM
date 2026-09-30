import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarClock, XCircle, ChevronDown, ChevronUp, CalendarPlus, ClipboardList, ArrowRight, Car } from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { listMyBookings, cancelBooking } from '../../services/bookingApi'
import { listJobs } from '../../services/jobApi'
import { getColorHex } from '../../utils/vehicle'
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

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'VEHICLE_RECEIVED']

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function DetailRow({ label, value, colorDot }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="uppercase tracking-widest text-xs" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
        {label}
      </span>
      <span className="inline-flex items-center gap-2 text-right" style={{ color: FOREGROUND }}>
        {value}
        {value && colorDot && (
          <span
            className="inline-block w-3 h-3 rounded-full shrink-0"
            title="Vehicle colour"
            style={{ background: colorDot, border: `1px solid ${LINE_STRONG}` }}
          />
        )}
      </span>
    </div>
  )
}

export default function BookingsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [jobsByBooking, setJobsByBooking] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cancelling, setCancelling] = useState(null)
  const [reason, setReason] = useState('')
  const [cancelModal, setCancelModal] = useState(false)

  const load = async () => {
    try {
      const res = await listMyBookings({ limit: 50 })
      setBookings(res.data?.bookings || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.all([listMyBookings({ limit: 50 }), listJobs({ limit: 100 })])
      .then(([bookingRes, jobRes]) => {
        if (cancelled) return
        setBookings(bookingRes.data?.bookings || [])
        const map = {}
        for (const job of jobRes.data?.jobs || []) {
          if (job.bookingId?._id || job.bookingId) {
            const bid = job.bookingId?._id || job.bookingId
            map[bid] = job._id
          }
        }
        setJobsByBooking(map)
      })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const openCancel = (booking) => {
    setCancelling(booking)
    setReason('')
    setCancelModal(true)
  }

  const handleCancel = async () => {
    try {
      const res = await cancelBooking(cancelling._id, { reason: reason || undefined })
      toast.success(res.message || 'Booking cancelled')
      setCancelModal(false)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CalendarClock size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Bookings
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Track and manage your service appointments
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/book-service')}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <CalendarPlus size={16} />
            Book a Service
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No bookings yet"
            message="Book your first detailing service and track it here."
            action={
              <button
                type="button"
                onClick={() => navigate('/book-service')}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                Book a Service
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const isOpen = expanded === booking._id
              const vehicle = booking.vehicleId
              const workshop = booking.workshopId

              return (
                <div
                  key={booking._id}
                  style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : booking._id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer transition-colors duration-200"
                    style={{ background: 'transparent', border: 'none' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = PANEL_ACTIVE)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-0">
                      <div>
                        <span
                          className="text-base font-black"
                          style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {booking.bookingNumber}
                        </span>
                        <p className="text-xs mt-0.5 flex items-center gap-2 flex-wrap" style={{ color: MUTED }}>
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
                          {vehicle?.variant && <span style={{ color: FOREGROUND }}>{vehicle.variant}</span>}
                          {vehicle?.color && (
                            <span
                              className="inline-block w-2.5 h-2.5 rounded-full align-middle"
                              title={`Colour: ${vehicle.color}`}
                              style={{ background: getColorHex(vehicle.color), border: `1px solid ${LINE_STRONG}` }}
                            />
                          )}
                        </p>
                        <p className="text-xs mt-0.5 font-semibold tracking-wider" style={{ color: ACCENT }}>
                          {vehicle?.registrationNumber || '—'}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                          {booking.appointment?.startTime || '—'} · {formatDate(booking.appointment?.date)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: FOREGROUND }}>
                        ₹{booking.pricing?.total?.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={booking.status} />
                      <span
                        className="flex items-center gap-1 text-xs uppercase tracking-widest"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      className="px-5 py-4"
                      style={{ borderTop: `1px solid ${LINE_STRONG}` }}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div>
                          <p
                            className="text-xs font-black uppercase tracking-widest mb-2"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: ACCENT }}
                          >
                            Appointment
                          </p>
                          <DetailRow label="Workshop" value={workshop?.name || '—'} />
                          <DetailRow label="Date" value={formatDate(booking.appointment?.date)} />
                          <DetailRow label="Time" value={`${booking.appointment?.startTime || '—'}${booking.appointment?.endTime ? ` – ${booking.appointment?.endTime}` : ''}`} />
                          <DetailRow label="Payment" value={booking.paymentStatus} />
                        </div>

                        <div>
                          <p
                            className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: ACCENT }}
                          >
                            <Car size={13} />
                            Vehicle
                          </p>
                          <DetailRow
                            label="Registration"
                            value={vehicle?.registrationNumber || '—'}
                          />
                          <DetailRow
                            label="Vehicle"
                            value={
                              vehicle
                                ? [vehicle.make, vehicle.model].filter(Boolean).join(' ')
                                : '—'
                            }
                          />
                          <DetailRow label="Variant" value={vehicle?.variant || '—'} />
                          <DetailRow
                            label="Colour"
                            value={vehicle?.color || '—'}
                            colorDot={vehicle?.color ? getColorHex(vehicle.color) : null}
                          />
                        </div>

                        <div>
                          <p
                            className="text-xs font-black uppercase tracking-widest mb-2"
                            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: ACCENT }}
                          >
                            Services
                          </p>
                          {(booking.services || []).length === 0 ? (
                            <p className="text-sm" style={{ color: MUTED }}>No services</p>
                          ) : (
                            booking.services.map((s) => (
                              <DetailRow
                                key={s.serviceId?._id || s.serviceId || s.serviceName}
                                label={`${s.serviceName} × ${s.quantity}`}
                                value={`₹${s.estimatedPrice?.toLocaleString('en-IN')}`}
                              />
                            ))
                          )}
                        </div>
                      </div>

                      {(booking.pricing || booking.cancellation) && (
                        <div
                          className="mt-4 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                          style={{ borderTop: `1px solid ${LINE_STRONG}` }}
                        >
                          <div className="space-y-1">
                            <DetailRow label="Subtotal" value={`₹${booking.pricing?.subtotal?.toLocaleString('en-IN') || '—'}`} />
                            {booking.pricing?.discount > 0 && (
                              <DetailRow label="Discount" value={`− ₹${booking.pricing.discount.toLocaleString('en-IN')}`} />
                            )}
                            {booking.pricing?.tax > 0 && (
                              <DetailRow label="Tax" value={`₹${booking.pricing.tax.toLocaleString('en-IN')}`} />
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {jobsByBooking[booking._id] && (
                              <button
                                type="button"
                                onClick={() => navigate(`/jobs/${jobsByBooking[booking._id]}`)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                                style={primaryButtonStyle}
                                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                              >
                                <ClipboardList size={13} />
                                Service Card
                                <ArrowRight size={13} />
                              </button>
                            )}
                            {booking.cancellation && (
                              <p className="text-xs" style={{ color: MUTED }}>
                                Cancelled: {booking.cancellation.reason}
                              </p>
                            )}
                            {CANCELLABLE.includes(booking.status) && (
                              <button
                                type="button"
                                onClick={() => openCancel(booking)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                                style={ghostButtonStyle}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                              >
                                <XCircle size={13} />
                                Cancel Booking
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title="Cancel Booking">
        <p className="text-sm mb-4" style={{ color: MUTED }}>
          Cancel booking <span style={{ color: ACCENT }}>{cancelling?.bookingNumber}</span>? This
          action cannot be undone.
        </p>
        <textarea
          rows={3}
          placeholder="Reason for cancellation (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full px-4 py-3 text-sm transition-colors duration-200 resize-none"
          style={{
            background: '#0c0c0c',
            border: `1px solid ${LINE_STRONG}`,
            color: FOREGROUND,
            fontFamily: "'Barlow', sans-serif",
            outline: 'none',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = ACCENT)}
          onBlur={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
        />
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setCancelModal(false)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Keep Booking
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            Yes, Cancel Booking
          </button>
        </div>
      </Modal>
    </div>
  )
}