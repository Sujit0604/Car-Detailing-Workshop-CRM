import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FileText, Plus, Eye, Send, Ban, Search } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { TextInput, TextArea } from '../../components/Field'
import { listInvoices, getInvoice, generateInvoice, issueInvoice, voidInvoice } from '../../services/invoiceApi'
import { formatDate, formatDateTime } from '../../utils/transitions'
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

const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'VOID']
const STATUS_FILTERS = ['ALL', ...INVOICE_STATUSES]
const VOID_BLOCKED_STATUSES = ['PARTIALLY_PAID', 'PAID', 'VOID']

const money = (value) => (value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const canIssue = (invoice) => invoice?.status === 'DRAFT'
const canVoid = (invoice) => invoice?.status && !VOID_BLOCKED_STATUSES.includes(invoice.status)

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ALL')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [generateOpen, setGenerateOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState({ jobId: '', estimateId: '' })
  const [saving, setSaving] = useState(false)

  const [issueTarget, setIssueTarget] = useState(null)
  const [issueForm, setIssueForm] = useState({ dueAt: '' })

  const [voidTarget, setVoidTarget] = useState(null)
  const [voidForm, setVoidForm] = useState({ reason: '' })

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (status !== 'ALL') params.status = status
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    let cancelled = false
    listInvoices(params)
      .then((res) => {
        if (cancelled) return
        setInvoices(res.data?.invoices || [])
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
  }, [page, status, fromDate, toDate])

  const visibleInvoices = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return invoices
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber?.toLowerCase().includes(term) ||
        inv.customerId?.name?.toLowerCase().includes(term) ||
        inv.bookingId?.bookingNumber?.toLowerCase().includes(term),
    )
  }, [invoices, search])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!generateForm.jobId.trim()) {
      toast.error('Job id is required')
      return
    }
    setSaving(true)
    try {
      await generateInvoice({
        jobId: generateForm.jobId.trim(),
        estimateId: generateForm.estimateId.trim() || undefined,
      })
      toast.success('Invoice generated')
      setGenerateOpen(false)
      setPage(1)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openIssue = (invoice) => {
    setIssueTarget(invoice)
    setIssueForm({ dueAt: '' })
  }

  const handleIssue = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await issueInvoice(issueTarget._id, { dueAt: issueForm.dueAt || undefined })
      toast.success('Invoice issued')
      setIssueTarget(null)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openVoid = (invoice) => {
    setVoidTarget(invoice)
    setVoidForm({ reason: '' })
  }

  const handleVoid = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await voidInvoice(voidTarget._id, { reason: voidForm.reason || undefined })
      toast.success('Invoice voided')
      setVoidTarget(null)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (invoice) => {
    setDetailLoading(true)
    setDetail(invoice)
    try {
      const res = await getInvoice(invoice._id)
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
              <FileText size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Invoices
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} invoices across all workshops
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setGenerateForm({ jobId: '', estimateId: '' }); setGenerateOpen(true) }}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <Plus size={16} />
            Generate Invoice
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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="Invoice / booking no"
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
        ) : visibleInvoices.length === 0 ? (
          <EmptyState icon={FileText} title="No invoices found" message="Invoices will appear here once they are generated from a job." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Invoice', 'Customer', 'Workshop', 'Total', 'Payment', 'Status', 'Issued', 'Actions'].map((h) => (
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
                {visibleInvoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {inv.customerId?.name || '—'}
                      <p className="text-xs" style={{ color: MUTED }}>{inv.bookingId?.bookingNumber || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {inv.workshopId?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold whitespace-nowrap" style={{ color: FOREGROUND }}>
                      ₹{money(inv.pricing?.grandTotal)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.paymentSummary?.status || 'UNPAID'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(inv)}
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
                          onClick={() => openIssue(inv)}
                          disabled={!canIssue(inv)}
                          title={canIssue(inv) ? 'Issue invoice' : 'Only draft invoices can be issued'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Send size={11} />
                          Issue
                        </button>
                        <button
                          type="button"
                          onClick={() => openVoid(inv)}
                          disabled={!canVoid(inv)}
                          title={canVoid(inv) ? 'Void invoice' : 'Invoices with payment history cannot be voided'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Ban size={11} />
                          Void
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

      <Modal open={generateOpen} onClose={() => setGenerateOpen(false)} title="Generate Invoice">
        <form onSubmit={handleGenerate} className="space-y-4" noValidate>
          <TextInput
            label="Job Id"
            required
            value={generateForm.jobId}
            onChange={(e) => setGenerateForm((s) => ({ ...s, jobId: e.target.value }))}
            placeholder="Job ObjectId"
          />
          <TextInput
            label="Estimate Id"
            value={generateForm.estimateId}
            onChange={(e) => setGenerateForm((s) => ({ ...s, estimateId: e.target.value }))}
            placeholder="Optional — defaults to the job estimate"
          />
          <p className="text-xs" style={{ color: MUTED }}>
            An invoice can only be generated once per job.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setGenerateOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {saving ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!issueTarget}
        onClose={() => setIssueTarget(null)}
        title={`Issue · ${issueTarget?.invoiceNumber || ''}`}
      >
        {issueTarget && (
          <form onSubmit={handleIssue} className="space-y-4" noValidate>
            <p className="text-sm" style={{ color: MUTED }}>
              Issuing makes this invoice payable by the customer.
            </p>
            <TextInput
              label="Due Date"
              type="date"
              value={issueForm.dueAt}
              onChange={(e) => setIssueForm((s) => ({ ...s, dueAt: e.target.value }))}
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIssueTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {saving ? 'Issuing...' : 'Issue Invoice'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title={`Void · ${voidTarget?.invoiceNumber || ''}`}
      >
        {voidTarget && (
          <form onSubmit={handleVoid} className="space-y-4" noValidate>
            <p className="text-sm" style={{ color: MUTED }}>
              Voiding is permanent and can only be done before any payment is captured.
            </p>
            <TextArea
              label="Reason"
              rows={3}
              value={voidForm.reason}
              onChange={(e) => setVoidForm((s) => ({ ...s, reason: e.target.value }))}
              placeholder="Duplicate invoice raised in error"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setVoidTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {saving ? 'Voiding...' : 'Void Invoice'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={`Invoice · ${detail?.invoiceNumber || ''}`}
        maxWidth="max-w-3xl"
      >
        {detailLoading ? (
          <Spinner />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={detail.status} />
              <StatusBadge status={detail.paymentSummary?.status || 'UNPAID'} />
              <span className="text-xl font-black" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                ₹{money(detail.pricing?.grandTotal)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Customer', detail.customerId?.name],
                ['Contact', detail.customerId?.phone],
                ['Booking', detail.bookingId?.bookingNumber],
                ['Estimate', detail.estimateId?.estimateNumber],
                ['Workshop', detail.workshopId?.name],
                ['Vehicle', detail.vehicleSnapshot?.registrationNumber],
                ['Currency', detail.currency],
                ['Issued', formatDateTime(detail.issuedAt)],
                ['Due', formatDate(detail.dueAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ color: FOREGROUND }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            {detail.voidReason && (
              <p className="text-sm" style={{ color: '#f87171' }}>Void reason: {detail.voidReason}</p>
            )}

            {detail.items?.length > 0 && (
              <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      {['Item', 'Type', 'Qty', 'Unit Price', 'Tax', 'Total'].map((h) => (
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
                    {detail.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>{item.description}</td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{item.type}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>₹{money(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>₹{money(item.taxAmount)}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>₹{money(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex flex-col items-end gap-1 text-sm">
              <div className="flex items-center gap-6" style={{ color: MUTED }}>
                <span>Subtotal</span>
                <span style={{ color: FOREGROUND }}>₹{money(detail.pricing?.subtotal)}</span>
              </div>
              <div className="flex items-center gap-6" style={{ color: '#10b981' }}>
                <span>Discount</span>
                <span>- ₹{money(detail.pricing?.discount)}</span>
              </div>
              <div className="flex items-center gap-6" style={{ color: MUTED }}>
                <span>Tax</span>
                <span style={{ color: FOREGROUND }}>₹{money(detail.pricing?.tax)}</span>
              </div>
              <div
                className="flex items-center gap-6 text-base font-black"
                style={{ color: FOREGROUND, borderTop: `1px solid ${LINE_STRONG}`, paddingTop: '0.5rem' }}
              >
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Grand Total</span>
                <span style={{ color: ACCENT }}>₹{money(detail.pricing?.grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Paid', money(detail.paymentSummary?.paidAmount)],
                ['Refunded', money(detail.paymentSummary?.refundedAmount)],
                ['Outstanding', money(detail.paymentSummary?.outstandingAmount)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ color: FOREGROUND }}>₹{value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
