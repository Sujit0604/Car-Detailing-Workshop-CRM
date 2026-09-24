import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  User,
  Truck,
  ClipboardList,
  Wallet,
  CalendarDays,
  FileText,
  Tag,
} from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { getBooking } from '../../services/bookingApi'
import { formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
} from '../../config/theme'

function formatAddress(address) {
  if (!address || typeof address !== 'object') return null
  return [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.country,
    address.postalCode,
  ].filter(Boolean).join(', ')
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
      <div
        className="flex items-center justify-center w-9 h-9 shrink-0"
        style={{ background: 'rgba(217,79,61,0.08)' }}
      >
        <Icon size={16} style={{ color: ACCENT }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {label}
        </p>
        <p className="text-sm mt-0.5 break-words" style={{ color: FOREGROUND }}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export default function BookingDetailPage() {
  const { bookingId } = useParams()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getBooking(bookingId)
      .then((res) => { if (!cancelled) setBooking(res.data) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [bookingId])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <Spinner label="Loading booking..." />
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: MUTED }}>Booking not found.</p>
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="mt-4 px-6 py-3 text-xs font-black uppercase tracking-widest"
            style={{
              background: ACCENT,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.16em',
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const coupon = booking.couponId
  const billing = booking.pricing || {}

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1
            className="text-3xl font-black uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {booking.bookingNumber}
          </h1>
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
        <p className="text-sm" style={{ color: MUTED }}>
          Created {formatDateTime(booking.createdAt)}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
            <h2
              className="text-base font-black uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Booking
            </h2>
            <InfoRow icon={ClipboardList} label="Booking Number" value={booking.bookingNumber} />
            <InfoRow icon={CalendarDays} label="Appointment" value={formatDateTime(booking.appointment?.date)} />
            <InfoRow icon={CalendarDays} label="Time Slot" value={booking.appointment?.startTime ? `${booking.appointment.startTime} — ${booking.appointment.endTime || ''}` : null} />
            <InfoRow icon={Wallet} label="Payment Status" value={booking.paymentStatus} />
            <InfoRow icon={ClipboardList} label="Customer Notes" value={booking.customerNotes} />
            {booking.cancellation?.cancelledAt && (
              <InfoRow icon={FileText} label="Cancelled By" value={`${booking.cancellation.cancelledBy?.name || 'Unknown'} · ${formatDateTime(booking.cancellation.cancelledAt)}`} />
            )}
            {booking.cancellation?.reason && (
              <InfoRow icon={FileText} label="Cancellation Reason" value={booking.cancellation.reason} />
            )}
          </section>

          <section className="space-y-6">
            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
              <h2
                className="text-base font-black uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Customer
              </h2>
              <InfoRow icon={User} label="Name" value={booking.customerId?.name} />
              <InfoRow icon={User} label="Email" value={booking.customerId?.email} />
              <InfoRow icon={User} label="Phone" value={booking.customerId?.phone} />
            </section>

            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
              <h2
                className="text-base font-black uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Vehicle & Workshop
              </h2>
              <InfoRow icon={Truck} label="Vehicle" value={booking.vehicleId ? `${booking.vehicleId.make} ${booking.vehicleId.model}` : null} />
              <InfoRow icon={Truck} label="Registration" value={booking.vehicleId?.registrationNumber} />
              <InfoRow icon={Truck} label="Colour" value={booking.vehicleId?.color} />
              {(booking.vehicleId?.images || []).length > 0 && (
                <div className="py-2.5" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  <p
                    className="text-xs uppercase tracking-widest mb-2"
                    style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    Vehicle Photos ({booking.vehicleId.images.length})
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                    {booking.vehicleId.images.map((img) => (
                      <img
                        key={img.publicId || img.url}
                        src={img.url}
                        alt="Vehicle"
                        className="w-28 h-20 object-cover shrink-0"
                        style={{ border: `1px solid ${LINE_STRONG}` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <InfoRow icon={ClipboardList} label="Workshop" value={booking.workshopId?.name} />
              <InfoRow icon={ClipboardList} label="Workshop Code" value={booking.workshopId?.code} />
              <InfoRow icon={ClipboardList} label="Workshop Address" value={formatAddress(booking.workshopId?.address)} />
            </section>
          </section>
        </div>

        {/* Services */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <h2
            className="text-base font-black uppercase tracking-widest mb-4"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
          >
            Booked Services ({booking.services?.length || 0})
          </h2>
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Service', 'Qty', 'Unit Price', 'Estimated Price', 'Duration'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {booking.services?.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                      {s.serviceName}
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{s.quantity}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>₹{s.unitPrice?.toLocaleString('en-IN') || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                      ₹{s.estimatedPrice?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                      {s.durationMinutes ? `${s.durationMinutes} min` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Pricing + coupon */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
            <h2
              className="text-base font-black uppercase tracking-widest mb-4"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Price Breakdown
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between" style={{ color: MUTED }}>
                <span>Subtotal</span>
                <span style={{ color: FOREGROUND }}>₹{billing.subtotal?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex items-center justify-between" style={{ color: '#10b981' }}>
                <span>Coupon Discount</span>
                <span>- ₹{billing.discount?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div className="flex items-center justify-between" style={{ color: MUTED }}>
                <span>Tax (18%)</span>
                <span style={{ color: FOREGROUND }}>₹{billing.tax?.toLocaleString('en-IN') || 0}</span>
              </div>
              <div
                className="flex items-center justify-between text-base font-black pt-3 mt-2"
                style={{ color: FOREGROUND, borderTop: `1px solid ${LINE_STRONG}` }}
              >
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>Total</span>
                <span style={{ color: ACCENT }}>₹{billing.total?.toLocaleString('en-IN') || 0}</span>
              </div>
            </div>
          </section>

          <section style={{ border: `1px solid ${coupon ? '#10b981' : LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
            <div className="flex items-center gap-2 mb-4">
              <Tag size={16} style={{ color: coupon ? '#10b981' : MUTED }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Coupon Used
              </h2>
            </div>
            {!coupon ? (
              <p className="text-sm" style={{ color: MUTED }}>
                No coupon was applied to this booking.
              </p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between" style={{ color: MUTED }}>
                  <span>Code</span>
                  <span className="font-black" style={{ color: '#10b981', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}>
                    {coupon.code}
                  </span>
                </div>
                {coupon.description && (
                  <p className="text-xs" style={{ color: MUTED }}>{coupon.description}</p>
                )}
                <div className="flex items-center justify-between" style={{ color: MUTED }}>
                  <span>Type</span>
                  <span style={{ color: FOREGROUND }}>{coupon.discountType?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center justify-between" style={{ color: MUTED }}>
                  <span>Value</span>
                  <span style={{ color: FOREGROUND }}>
                    {coupon.discountType === 'PERCENTAGE'
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue.toLocaleString('en-IN')}`}
                  </span>
                </div>
                {coupon.maximumDiscount > 0 && (
                  <div className="flex items-center justify-between" style={{ color: MUTED }}>
                    <span>Max Discount</span>
                    <span style={{ color: FOREGROUND }}>₹{coupon.maximumDiscount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {coupon.minimumOrderValue > 0 && (
                  <div className="flex items-center justify-between" style={{ color: MUTED }}>
                    <span>Min Order Value</span>
                    <span style={{ color: FOREGROUND }}>₹{coupon.minimumOrderValue.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between" style={{ color: MUTED }}>
                  <span>Applied Discount</span>
                  <span style={{ color: '#10b981' }}>₹{billing.discount?.toLocaleString('en-IN') || 0}</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}