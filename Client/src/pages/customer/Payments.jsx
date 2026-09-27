import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CreditCard,
  FileText,
  Receipt,
  RefreshCw,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import { listMyPayments } from '../../services/paymentApi'
import { formatDateTime } from '../../utils/transitions'
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

const formatRupees = (amountMinor) =>
  `₹${((Number(amountMinor) || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function SummaryCell({ label, value, valueColor = FOREGROUND }) {
  return (
    <div className="flex flex-col items-end">
      <span
        className="text-[11px] uppercase tracking-widest"
        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
      >
        {label}
      </span>
      <span className="text-sm font-semibold" style={{ color: valueColor }}>
        {value}
      </span>
    </div>
  )
}

export default function PaymentsPage() {
  const navigate = useNavigate()
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      setError('')
      const res = await listMyPayments({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
      setPayments(res.data?.payments || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    listMyPayments({ limit: 50 })
      .then((res) => {
        if (cancelled) return
        setPayments(res.data?.payments || [])
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
    toast.success('Payments refreshed')
  }

  const paidTotal = payments
    .filter((p) => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + (Number(p.amountMinor) || 0), 0)

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
              <CreditCard size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Payments
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Every online and offline payment recorded against your invoices
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-50"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Receipt size={14} />
              View Invoices
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
          <Spinner label="Loading payments..." />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments yet"
            message="Once a workshop raises an invoice you can settle it online and it will show up here."
            action={
              <button
                type="button"
                onClick={() => navigate('/invoices')}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                Go to Invoices
              </button>
            }
          />
        ) : (
          <>
            <section
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}
            >
              <SummaryCell label="Total payments" value={payments.length} />
              <SummaryCell label="Successful" value={payments.filter((p) => p.status === 'SUCCESS').length} valueColor="#10b981" />
              <SummaryCell label="Paid value" value={formatRupees(paidTotal)} valueColor={ACCENT} />
            </section>

            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
              <table className="w-full text-left min-w-[720px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['Payment', 'Invoice', 'Workshop', 'Amount', 'Status', 'Paid on'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      <td className="px-4 py-3">
                        <span
                          className="text-sm font-black"
                          style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {payment.paymentNumber}
                        </span>
                        <p className="text-xs" style={{ color: MUTED }}>{payment.gateway || 'RAZORPAY'}</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: FOREGROUND }}>
                        {payment.invoiceId?.invoiceNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                        {payment.workshopId?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold" style={{ color: FOREGROUND }}>
                        {formatRupees(payment.amountMinor)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={payment.status} />
                        {payment.failureReason && (
                          <p className="text-xs mt-1" style={{ color: '#f87171' }}>{payment.failureReason}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: MUTED }}>
                        {formatDateTime(payment.paidAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
            >
              <FileText size={14} />
              Need to pay an invoice? Open invoices
            </button>
          </>
        )}
      </div>
    </div>
  )
}
