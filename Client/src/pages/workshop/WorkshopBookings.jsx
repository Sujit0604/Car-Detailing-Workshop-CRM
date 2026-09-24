import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Wrench, Wallet, Eye } from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
} from '../../components/Field'
import { listWorkshopBookings, updateBookingStatus, updateBookingPaymentStatus } from '../../services/bookingApi'
import { listWorkshops } from '../../services/masterApi'
import { useAuth } from '../../contexts/authContext'
import { BOOKING_NEXT_STATUS, BOOKING_PAYMENT_STATUSES, formatDate } from '../../utils/transitions'
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

const BOOKING_FILTERS = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'VEHICLE_RECEIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
]

export default function WorkshopBookingsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const [statusTarget, setStatusTarget] = useState(null)
  const [paymentTarget, setPaymentTarget] = useState(null)
  const [statusValue, setStatusValue] = useState('')
  const [paymentValue, setPaymentValue] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    let cancelled = false
    listWorkshops({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const list = res.data?.workshops || res.data || []
        setWorkshops(Array.isArray(list) ? list : [])
        if (!Array.isArray(list) || list.length === 0) return
        const preferred =
          (typeof user?.workshopId === 'object' && user.workshopId?._id) ||
          (typeof user?.workshopId === 'string' && user.workshopId) ||
          ''
        const matched = preferred && list.some((w) => w._id === preferred)
        setWorkshopId((prev) => prev || (matched ? preferred : list[0]._id))
      })
      .catch((err) => toast.error(err.message))
    return () => {
      cancelled = true
    }
  }, [user?.workshopId])

  const load = async () => {
    if (!workshopId) return
    try {
      const res = await listWorkshopBookings(workshopId, { limit: 100 })
      setBookings(res.data?.bookings || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    listWorkshopBookings(workshopId, { limit: 100 })
      .then((res) => { if (!cancelled) setBookings(res.data?.bookings || []) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workshopId])

  const visibleBookings = filter === 'ALL' ? bookings : bookings.filter((b) => b.status === filter)

  const openStatus = (booking) => {
    setStatusTarget(booking)
    setStatusValue('')
  }

  const openPayment = (booking) => {
    setPaymentTarget(booking)
    setPaymentValue(booking.paymentStatus)
  }

  const handleStatus = async () => {
    setUpdating(true)
    try {
      await updateBookingStatus(statusTarget._id, { status: statusValue })
      toast.success(`Booking moved to ${statusValue.replace(/_/g, ' ')}`)
      setStatusTarget(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handlePayment = async () => {
    setUpdating(true)
    try {
      await updateBookingPaymentStatus(paymentTarget._id, { paymentStatus: paymentValue })
      toast.success('Payment status updated')
      setPaymentTarget(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Wrench size={22} style={{ color: ACCENT }} />
            <h1
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Workshop Bookings
            </h1>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>
            Manage bookings and payment status
          </p>
        </div>

        <div className="max-w-sm">
          <SelectInput
            label="Workshop"
            required
            placeholder="Select a workshop"
            value={workshopId}
            onChange={(e) => { setLoading(true); setWorkshopId(e.target.value) }}
          >
            {workshops.map((w) => (
              <option key={w._id} value={w._id} style={{ background: PANEL }}>
                {w.name}
                {w.address?.city ? ` · ${w.address.city}` : ''}
              </option>
            ))}
          </SelectInput>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {BOOKING_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.1em',
                border: `1px solid ${filter === f ? ACCENT : LINE_STRONG}`,
                color: filter === f ? '#fff' : MUTED,
                background: filter === f ? ACCENT : 'transparent',
              }}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {!workshopId ? (
          <EmptyState title="Select a workshop" message="Choose a workshop to see its bookings." />
        ) : loading ? (
          <Spinner />
        ) : visibleBookings.length === 0 ? (
          <EmptyState title="No bookings found" message="Bookings for this workshop will appear here." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Booking', 'Customer', 'Vehicle', 'Date', 'Amount', 'Status', 'Payment', 'Actions'].map((h) => (
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
                {visibleBookings.map((b) => (
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
                      {b.customerId?.name || '—'}
                      <p className="text-xs" style={{ color: MUTED }}>{b.customerId?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : '—'}
                      <p className="text-xs">{b.vehicleId?.registrationNumber || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDate(b.appointment?.date)} · {b.appointment?.startTime || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        ₹{(b.pricing?.total || 0).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.paymentStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/workshop/bookings/${b._id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Eye size={11} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatus(b)}
                          disabled={(BOOKING_NEXT_STATUS[b.status] || []).length === 0}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          Status
                        </button>
                        <button
                          type="button"
                          onClick={() => openPayment(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Wallet size={11} />
                          Payment
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={`Advance ${statusTarget?.bookingNumber || ''}`}
      >
        <SelectInput
          label="Next Status"
          required
          placeholder="Select next status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
        >
          {(BOOKING_NEXT_STATUS[statusTarget?.status] || []).map((s) => (
            <option key={s} value={s} style={{ background: PANEL }}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectInput>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setStatusTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStatus}
            disabled={updating || !statusValue}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!paymentTarget}
        onClose={() => setPaymentTarget(null)}
        title={`Payment · ${paymentTarget?.bookingNumber || ''}`}
      >
        <SelectInput
          label="Payment Status"
          required
          value={paymentValue}
          onChange={(e) => setPaymentValue(e.target.value)}
        >
          {BOOKING_PAYMENT_STATUSES.map((s) => (
            <option key={s} value={s} style={{ background: PANEL }}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectInput>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setPaymentTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePayment}
            disabled={updating || !paymentValue}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Payment'}
          </button>
        </div>
      </Modal>
    </div>
  )
}