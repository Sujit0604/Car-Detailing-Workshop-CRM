import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Wallet, RotateCcw, Plus, Eye, Search } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextInput, TextArea } from '../../components/Field'
import { listPayments, getPayment, recordOfflinePayment, refundPayment } from '../../services/paymentApi'
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

const PAYMENT_STATUSES = ['CREATED', 'PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED']
const PAYMENT_METHODS = ['RAZORPAY', 'CASH', 'UPI', 'CARD']
const OFFLINE_METHODS = ['CASH', 'UPI', 'CARD']
const STATUS_FILTERS = ['ALL', ...PAYMENT_STATUSES]

const toRupees = (amountMinor) => ((amountMinor || 0) / 100).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const toMinor = (rupees) => Math.round(Number(rupees) * 100)

const canRefund = (payment) =>
  payment?.gateway === 'RAZORPAY' &&
  !!payment?.gatewayPaymentId &&
  ['SUCCESS', 'PARTIALLY_REFUNDED'].includes(payment?.status)

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ALL')
  const [method, setMethod] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [recordOpen, setRecordOpen] = useState(false)
  const [recordForm, setRecordForm] = useState({ invoiceId: '', method: 'CASH', amount: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const [refundTarget, setRefundTarget] = useState(null)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (status !== 'ALL') params.status = status
    if (method) params.method = method
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    let cancelled = false
    listPayments(params)
      .then((res) => {
        if (cancelled) return
        setPayments(res.data?.payments || [])
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
  }, [page, status, method, fromDate, toDate])

  const visiblePayments = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return payments
    return payments.filter(
      (p) =>
        p.paymentNumber?.toLowerCase().includes(term) ||
        p.invoiceId?.invoiceNumber?.toLowerCase().includes(term) ||
        p.customerId?.name?.toLowerCase().includes(term),
    )
  }, [payments, search])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const openRecord = () => {
    setRecordForm({ invoiceId: '', method: 'CASH', amount: '', notes: '' })
    setRecordOpen(true)
  }

  const handleRecord = async (e) => {
    e.preventDefault()
    if (!recordForm.invoiceId.trim()) {
      toast.error('Invoice id is required')
      return
    }
    if (!recordForm.amount || Number(recordForm.amount) <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    setSaving(true)
    try {
      await recordOfflinePayment({
        invoiceId: recordForm.invoiceId.trim(),
        method: recordForm.method,
        amountMinor: toMinor(recordForm.amount),
        notes: recordForm.notes || undefined,
      })
      toast.success('Offline payment recorded')
      setRecordOpen(false)
      setLoading(true)
      setPage(1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openRefund = (payment) => {
    setRefundTarget(payment)
    setRefundForm({ amount: '', reason: '' })
  }

  const handleRefund = async (e) => {
    e.preventDefault()
    const minor = toMinor(refundForm.amount)
    if (minor <= 0) {
      toast.error('Enter a valid refund amount')
      return
    }
    setSaving(true)
    try {
      await refundPayment(refundTarget._id, {
        amountMinor: minor,
        reason: refundForm.reason || undefined,
      })
      toast.success('Refund initiated')
      setRefundTarget(null)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (payment) => {
    setDetailLoading(true)
    setDetail(payment)
    try {
      const res = await getPayment(payment._id)
      setDetail(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Wallet size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Payments
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} payments across all workshops
            </p>
          </div>
          <button
            type="button"
            onClick={openRecord}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <Plus size={16} />
            Record Payment
          </button>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SelectInput
            label="Method"
            value={method}
            placeholder="All methods"
            onChange={(e) => { setMethod(e.target.value); setPage(1); setLoading(true) }}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m} style={{ background: PANEL }}>
                {m}
              </option>
            ))}
          </SelectInput>
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-1.5"
              style={{ color: MUTED, letterSpacing: '0.14em' }}
            >
              Search
            </label>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: MUTED }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Payment / invoice no"
                className="w-full pl-9 pr-4 py-3 text-sm transition-colors duration-200"
                style={{
                  background: '#0c0c0c',
                  border: '1px solid #2a2a2a',
                  color: FOREGROUND,
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT }}
                onBlur={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
              />
            </div>
          </div>
          <TextInput
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); setLoading(true) }}
          />
          <TextInput
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); setLoading(true) }}
          />
        </div>

        {loading ? (
          <Spinner />
        ) : visiblePayments.length === 0 ? (
          <EmptyState icon={Wallet} title="No payments found" message="Payments will appear here as invoices are settled." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Payment', 'Invoice', 'Customer', 'Method', 'Amount', 'Status', 'Paid At', 'Actions'].map((h) => (
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
                {visiblePayments.map((p) => (
                  <tr
                    key={p._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {p.paymentNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {p.invoiceId?.invoiceNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {p.customerId?.name || '—'}
                      <p className="text-xs" style={{ color: MUTED }}>{p.workshopId?.name || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: MUTED }}>{p.method || p.gateway}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                      ₹{toRupees(p.amountMinor)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDateTime(p.paidAt || p.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(p)}
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
                          onClick={() => openRefund(p)}
                          disabled={!canRefund(p)}
                          title={canRefund(p) ? 'Refund payment' : 'Only captured Razorpay payments can be refunded'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <RotateCcw size={11} />
                          Refund
                        </button>
                      </div>
                    </td>
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

      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Offline Payment">
        <form onSubmit={handleRecord} className="space-y-4" noValidate>
          <TextInput
            label="Invoice Id"
            required
            value={recordForm.invoiceId}
            onChange={(e) => setRecordForm((s) => ({ ...s, invoiceId: e.target.value }))}
            placeholder="Invoice ObjectId"
          />
          <SelectInput
            label="Method"
            required
            value={recordForm.method}
            onChange={(e) => setRecordForm((s) => ({ ...s, method: e.target.value }))}
          >
            {OFFLINE_METHODS.map((m) => (
              <option key={m} value={m} style={{ background: PANEL }}>
                {m}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Amount"
            required
            type="number"
            min={0}
            step="0.01"
            value={recordForm.amount}
            onChange={(e) => setRecordForm((s) => ({ ...s, amount: e.target.value }))}
            placeholder="2500.00"
          />
          <TextArea
            label="Notes"
            rows={3}
            value={recordForm.notes}
            onChange={(e) => setRecordForm((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Collected at the front desk"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRecordOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {saving ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!refundTarget}
        onClose={() => setRefundTarget(null)}
        title={`Refund · ${refundTarget?.paymentNumber || ''}`}
      >
        {refundTarget && (
          <form onSubmit={handleRefund} className="space-y-4" noValidate>
            <p className="text-sm" style={{ color: MUTED }}>
              Captured amount:{' '}
              <span style={{ color: FOREGROUND }}>₹{toRupees(refundTarget.amountMinor)}</span>
            </p>
            <TextInput
              label="Refund Amount"
              required
              type="number"
              min={0}
              step="0.01"
              value={refundForm.amount}
              onChange={(e) => setRefundForm((s) => ({ ...s, amount: e.target.value }))}
              placeholder="500.00"
            />
            <TextArea
              label="Reason"
              rows={3}
              value={refundForm.reason}
              onChange={(e) => setRefundForm((s) => ({ ...s, reason: e.target.value }))}
              placeholder="Service cancelled by customer"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRefundTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {saving ? 'Submitting...' : 'Refund'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Payment · ${detail?.paymentNumber || ''}`}
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <Spinner />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <StatusBadge status={detail.status} />
              <span className="text-xl font-black" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                ₹{toRupees(detail.amountMinor)}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Invoice', detail.invoiceId?.invoiceNumber],
                ['Booking', detail.bookingId?.bookingNumber],
                ['Customer', detail.customerId?.name],
                ['Contact', detail.customerId?.phone],
                ['Workshop', detail.workshopId?.name],
                ['Gateway', detail.gateway],
                ['Method', detail.method],
                ['Currency', detail.currency],
                ['Paid At', formatDateTime(detail.paidAt)],
                ['Created', formatDateTime(detail.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ color: FOREGROUND }}>{value || '—'}</span>
                </div>
              ))}
            </div>
            {detail.metadata?.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Notes
                </p>
                <p className="text-sm" style={{ color: FOREGROUND }}>{detail.metadata.notes}</p>
              </div>
            )}
            {detail.failureReason && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Failure Reason
                </p>
                <p className="text-sm" style={{ color: '#f87171' }}>{detail.failureReason}</p>
              </div>
            )}
            {detail.refunds?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Refund History
                </p>
                <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                  <table className="w-full text-left">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        {['Amount', 'Reason', 'Status', 'Refunded At'].map((h) => (
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
                      {detail.refunds.map((r, idx) => (
                        <tr key={r._id || idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                          <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>₹{toRupees(r.amountMinor)}</td>
                          <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{r.reason || '—'}</td>
                          <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                          <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{formatDateTime(r.refundedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
