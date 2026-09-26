import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  FileText,
  Receipt,
  CreditCard,
  XCircle,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { listMyInvoices, getInvoice } from '../../services/invoiceApi'
import { createPaymentOrder, verifyPayment } from '../../services/paymentApi'
import { openRazorpayCheckout, getRazorpayKeyId } from '../../services/razorpayCheckout'
import { useAuth } from '../../contexts/authContext'
import { formatDate, formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  ACCENT_HOVER,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../../config/theme'

const rupees = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

const PAYABLE_STATUSES = ['ISSUED', 'PARTIALLY_PAID']

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span
        className="uppercase tracking-widest text-xs shrink-0"
        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {label}
      </span>
      <span className="text-right" style={{ color: FOREGROUND }}>{value || '—'}</span>
    </div>
  )
}

export default function InvoicesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const keyId = getRazorpayKeyId()

  useEffect(() => {
    let cancelled = false
    listMyInvoices({ limit: 50 })
      .then((res) => {
        if (cancelled) return
        setInvoices(res.data?.invoices || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = async () => {
    try {
      setError('')
      const res = await listMyInvoices({ limit: 50 })
      setInvoices(res.data?.invoices || [])
    } catch (err) {
      setError(err.message)
    }
  }

  const openDetail = async (invoice) => {
    setDetail(invoice)
    setDetailLoading(true)
    setPayError('')
    try {
      const res = await getInvoice(invoice._id)
      setDetail(res.data)
    } catch (err) {
      setPayError(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetail(null)
    setPayError('')
  }

  const handlePay = async (invoice) => {
    setPaying(true)
    setPayError('')
    try {
      const orderRes = await createPaymentOrder(invoice._id)
      const order = orderRes.data
      const paymentId = order?.payment?._id
      const orderId = order?.orderId || order?.order?.id

      if (!paymentId || !orderId) {
        throw new Error('The server did not return a Razorpay order')
      }

      const checkout = await openRazorpayCheckout({
        orderId,
        amount: order.amountMinor,
        currency: order.currency || invoice.currency || 'INR',
        keyId: order.keyId || keyId,
        name: 'KROM DETAIL',
        description: `Invoice ${invoice.invoiceNumber}`,
        prefill: {
          name: user?.name || invoice.customerSnapshot?.name,
          email: user?.email || invoice.customerSnapshot?.email,
          contact: user?.phone || invoice.customerSnapshot?.phone,
        },
      })

      await verifyPayment(paymentId, {
        razorpayOrderId: checkout.razorpay_order_id,
        razorpayPaymentId: checkout.razorpay_payment_id,
        razorpaySignature: checkout.razorpay_signature,
      })

      toast.success('Payment received. Thank you!')
      closeDetail()
      refresh()
    } catch (err) {
      if (err.message === 'Payment cancelled') {
        setPayError('Payment cancelled — the invoice is still outstanding.')
      } else {
        setPayError(err.message)
      }
    } finally {
      setPaying(false)
    }
  }

  const outstanding = detail?.paymentSummary?.outstandingAmount ?? detail?.pricing?.grandTotal ?? 0
  const canPay =
    detail && PAYABLE_STATUSES.includes(detail.status) && Number(outstanding) > 0 && !paying

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
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
              <Receipt size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Invoices
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Review the itemised bill and pay securely via Razorpay
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/payments')}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <CreditCard size={14} />
            Payment History
          </button>
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
          <Spinner label="Loading invoices..." />
        ) : invoices.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            message="Invoices are raised once your job is complete. They will appear here as soon as they are issued."
            action={
              <button
                type="button"
                onClick={() => navigate('/bookings')}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                View Bookings
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => {
              const summary = invoice.paymentSummary || {}
              const due = summary.outstandingAmount ?? invoice.pricing?.grandTotal ?? 0
              return (
                <div
                  key={invoice._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4"
                  style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span
                        className="text-base font-black"
                        style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {invoice.invoiceNumber}
                      </span>
                      <StatusBadge status={invoice.status} />
                      {summary.status && summary.status !== 'UNPAID' && (
                        <StatusBadge status={summary.status} />
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: MUTED }}>
                      {invoice.workshopId?.name || '—'} · {invoice.vehicleSnapshot?.registrationNumber || invoice.vehicleId?.registrationNumber || '—'} · Issued {formatDate(invoice.issuedAt || invoice.createdAt)}
                      {invoice.dueAt ? ` · Due ${formatDate(invoice.dueAt)}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {Number(due) > 0 ? 'Outstanding' : 'Total'}
                      </p>
                      <p className="text-lg font-black" style={{ color: Number(due) > 0 ? ACCENT : '#10b981' }}>
                        {rupees(Number(due) > 0 ? due : invoice.pricing?.grandTotal)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDetail(invoice)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                      style={ghostButtonStyle}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
                    >
                      View
                    </button>
                    {PAYABLE_STATUSES.includes(invoice.status) && Number(due) > 0 && (
                      <button
                        type="button"
                        onClick={() => openDetail(invoice)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                        style={primaryButtonStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                      >
                        <CreditCard size={13} />
                        Pay Now
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={closeDetail} title={detail ? `Invoice ${detail.invoiceNumber}` : 'Invoice'} maxWidth="max-w-2xl">
        {detailLoading ? (
          <Spinner label="Loading invoice..." />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={detail.status} />
                {detail.paymentSummary?.status && (
                  <StatusBadge status={detail.paymentSummary.status} />
                )}
              </div>
              <span className="text-xs" style={{ color: MUTED }}>
                {detail.currency || 'INR'} · Issued {formatDate(detail.issuedAt || detail.createdAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <DetailRow label="Workshop" value={detail.workshopId?.name} />
                <DetailRow label="Vehicle" value={detail.vehicleSnapshot?.registrationNumber || detail.vehicleId?.registrationNumber} />
                <DetailRow
                  label="Make / Model"
                  value={[detail.vehicleSnapshot?.make || detail.vehicleId?.make, detail.vehicleSnapshot?.model || detail.vehicleId?.model].filter(Boolean).join(' ')}
                />
              </div>
              <div>
                <DetailRow label="Booking" value={detail.bookingId?.bookingNumber} />
                <DetailRow label="Job" value={detail.jobSnapshot?.jobNumber} />
                <DetailRow label="Due date" value={formatDate(detail.dueAt)} />
              </div>
            </div>

            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
              <table className="w-full text-left min-w-[480px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['Description', 'Qty', 'Unit', 'Total'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(detail.items || []).map((item, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      <td className="px-3 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                        {item.description}
                        <p className="text-xs" style={{ color: MUTED }}>{item.type}</p>
                      </td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: MUTED }}>{item.quantity}</td>
                      <td className="px-3 py-2.5 text-sm" style={{ color: MUTED }}>{rupees(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>{rupees(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-end gap-1 text-sm">
              <DetailRow label="Subtotal" value={rupees(detail.pricing?.subtotal)} />
              {Number(detail.pricing?.discount) > 0 && (
                <DetailRow label="Discount" value={`− ${rupees(detail.pricing.discount)}`} />
              )}
              <DetailRow label="Tax" value={rupees(detail.pricing?.tax)} />
              <div className="flex items-center gap-6 text-base font-black" style={{ borderTop: `1px solid ${LINE_STRONG}`, paddingTop: '0.5rem' }}>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Grand Total</span>
                <span style={{ color: ACCENT }}>{rupees(detail.pricing?.grandTotal)}</span>
              </div>
              {Number(detail.paymentSummary?.paidAmount) > 0 && (
                <DetailRow label="Paid" value={rupees(detail.paymentSummary.paidAmount)} />
              )}
              {Number(outstanding) > 0 && (
                <div className="flex items-center gap-6 font-black" style={{ color: ACCENT }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Outstanding</span>
                  <span>{rupees(outstanding)}</span>
                </div>
              )}
            </div>

            {payError && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 text-sm"
                style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
              >
                <XCircle size={15} className="shrink-0 mt-0.5" />
                <span>{payError}</span>
              </div>
            )}

            {!keyId && PAYABLE_STATUSES.includes(detail.status) && (
              <p className="text-xs" style={{ color: MUTED }}>
                Razorpay key is not configured. Add <span style={{ color: ACCENT }}>VITE_RAZORPAY_KEY_ID</span> to Client/.env to enable online payment.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={closeDetail}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={ghostButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
              >
                Close
              </button>
              {canPay && (
                <button
                  type="button"
                  onClick={() => handlePay(detail)}
                  className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                >
                  <CreditCard size={13} />
                  {paying ? 'Processing...' : `Pay ${rupees(outstanding)}`}
                </button>
              )}
            </div>

            {detail.voidedAt && (
              <p className="text-xs" style={{ color: '#f87171' }}>
                Voided {formatDateTime(detail.voidedAt)}
                {detail.voidReason ? ` — ${detail.voidReason}` : ''}
              </p>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
