import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Car,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Gauge,
  ListChecks,
  Star,
  ThumbsDown,
  ThumbsUp,
  Truck,
  User,
  Wrench,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { TextArea } from '../../components/Field'
import { getJob, getEstimate, respondToEstimate } from '../../services/jobApi'
import { listJobTasks } from '../../services/jobTaskApi'
import { listInspections } from '../../services/inspectionApi'
import { listMyInvoices } from '../../services/invoiceApi'
import { createPaymentOrder, verifyPayment } from '../../services/paymentApi'
import { openRazorpayCheckout, getRazorpayKeyId } from '../../services/razorpayCheckout'
import { useAuth } from '../../contexts/authContext'
import { formatDateTime } from '../../utils/transitions'
import { getJobBackPath } from '../../utils/routes'
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

const PIPELINE = [
  'CREATED',
  'CHECK_IN',
  'INSPECTION',
  'ESTIMATE_PENDING',
  'CUSTOMER_APPROVAL',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
  'COMPLETED',
]

const CONDITION_COLORS = {
  GOOD: '#10b981',
  FAIR: '#f59e0b',
  POOR: '#fb923c',
  DAMAGED: '#f87171',
  REPLACE_REQUIRED: '#ef4444',
}

const rupees = (value) => `₹${(Number(value) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

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
        <p
          className="text-xs uppercase tracking-widest"
          style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          {label}
        </p>
        <p className="text-sm mt-0.5 break-words" style={{ color: FOREGROUND }}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, action, children }) {
  return (
    <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={18} style={{ color: ACCENT }} />}
          <h2
            className="text-base font-black uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [job, setJob] = useState(null)
  const [estimate, setEstimate] = useState(null)
  const [tasks, setTasks] = useState([])
  const [inspections, setInspections] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [respondOpen, setRespondOpen] = useState(false)
  const [respondRemarks, setRespondRemarks] = useState('')
  const [updating, setUpdating] = useState(false)

  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')

  const keyId = getRazorpayKeyId()

  const load = async () => {
    setError('')
    const [jobRes, estimateRes, taskRes, inspectionRes, invoiceRes] = await Promise.allSettled([
      getJob(jobId),
      getEstimate(jobId),
      listJobTasks(jobId, { limit: 100 }),
      listInspections({ jobId, limit: 50 }),
      listMyInvoices({ jobId, limit: 50 }),
    ])

    if (jobRes.status === 'fulfilled') {
      setJob(jobRes.value.data)
    } else {
      setError(jobRes.reason?.message || 'Unable to load this job')
    }
    if (estimateRes.status === 'fulfilled') setEstimate(estimateRes.value.data)
    else setEstimate(null)
    if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data?.tasks || [])
    if (inspectionRes.status === 'fulfilled') setInspections(inspectionRes.value.data?.inspections || [])
    if (invoiceRes.status === 'fulfilled') setInvoices(invoiceRes.value.data?.invoices || [])
  }

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      getJob(jobId),
      getEstimate(jobId),
      listJobTasks(jobId, { limit: 100 }),
      listInspections({ jobId, limit: 50 }),
      listMyInvoices({ jobId, limit: 50 }),
    ])
      .then(([jobRes, estimateRes, taskRes, inspectionRes, invoiceRes]) => {
        if (cancelled) return
        if (jobRes.status === 'fulfilled') setJob(jobRes.value.data)
        else setError(jobRes.reason?.message || 'Unable to load this job')
        if (estimateRes.status === 'fulfilled') setEstimate(estimateRes.value.data)
        if (taskRes.status === 'fulfilled') setTasks(taskRes.value.data?.tasks || [])
        if (inspectionRes.status === 'fulfilled') setInspections(inspectionRes.value.data?.inspections || [])
        if (invoiceRes.status === 'fulfilled') setInvoices(invoiceRes.value.data?.invoices || [])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [jobId])

  const handleRespond = async (action, cancelBooking = false) => {
    setUpdating(true)
    try {
      await respondToEstimate(job._id, {
        action,
        remarks: respondRemarks || undefined,
        ...(cancelBooking ? { cancelBooking: true } : {}),
      })
      toast.success(
        cancelBooking
          ? 'Booking cancelled — this job is closed'
          : action === 'APPROVED'
            ? 'Estimate approved — work can begin'
            : 'Estimate rejected',
      )
      setRespondOpen(false)
      setRespondRemarks('')
      await load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
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
        currency: order.currency || 'INR',
        keyId: order.keyId || keyId,
        name: 'KROM DETAIL',
        description: `Invoice ${invoice.invoiceNumber}`,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.phone,
        },
      })

      await verifyPayment(paymentId, {
        razorpayOrderId: checkout.razorpay_order_id,
        razorpayPaymentId: checkout.razorpay_payment_id,
        razorpaySignature: checkout.razorpay_signature,
      })

      toast.success('Payment received. Thank you!')
      await load()
    } catch (err) {
      setPayError(
        err.message === 'Payment cancelled'
          ? 'Payment cancelled — the invoice is still outstanding.'
          : err.message,
      )
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AppNav />
        <Spinner label="Loading your service card..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: MUTED }}>{error || 'Job not found.'}</p>
          <button
            type="button"
            onClick={() => navigate(getJobBackPath('CUSTOMER'))}
            className="mt-4 px-6 py-3 text-xs font-black uppercase tracking-widest"
            style={primaryButtonStyle}
          >
            Back to Bookings
          </button>
        </div>
      </div>
    )
  }

  const pipelineIndex = PIPELINE.indexOf(job.status)
  const currentIndex = pipelineIndex === -1 ? -1 : pipelineIndex
  const canRespondEstimate =
    job.status === 'CUSTOMER_APPROVAL' && estimate?.status === 'PENDING_APPROVAL'
  const payableInvoice = invoices.find(
    (invoice) =>
      ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) &&
      Number(invoice.paymentSummary?.outstandingAmount ?? invoice.pricing?.grandTotal ?? 0) > 0,
  )

  const subtotal = (estimate?.items || []).reduce(
    (sum, item) => sum + (item.quantity || 1) * (item.unitPrice || 0),
    0,
  )
  const estimateTotal =
    estimate?.pricing?.total ?? subtotal - (estimate?.pricing?.discount || 0) + (estimate?.pricing?.tax || 0)

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(getJobBackPath('CUSTOMER'))}
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
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {job.jobNumber}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Booking {job.bookingId?.bookingNumber} · {job.workshopId?.name} · Updated{' '}
              {formatDateTime(job.updatedAt)}
            </p>
          </div>

          {canRespondEstimate && (
            <button
              type="button"
              onClick={() => setRespondOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <ThumbsUp size={16} />
              Approve / Reject Estimate
            </button>
          )}
        </div>

        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        <SectionCard icon={ClipboardList} title="Workflow Progress">
          <div className="flex items-start justify-between overflow-x-auto pb-2">
            {PIPELINE.map((stage, i) => {
              const done = currentIndex >= 0 && i < currentIndex
              const current = i === currentIndex
              return (
                <div key={stage} className="flex items-start flex-1 min-w-[70px]">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: done || current ? ACCENT : LINE_STRONG,
                        background: done || current ? 'rgba(217,79,61,0.12)' : 'transparent',
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={13} style={{ color: ACCENT }} />
                      ) : current ? (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: LINE_STRONG }} />
                      )}
                    </div>
                    <span
                      className="mt-1.5 text-[10px] uppercase tracking-wide text-center leading-tight whitespace-nowrap"
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
                      className="flex-1 mt-3.5 mx-1"
                      style={{ height: 2, background: i < currentIndex ? ACCENT : LINE_STRONG }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard icon={ClipboardList} title="Job Details">
            <InfoRow icon={User} label="Workshop" value={job.workshopId?.name} />
            <InfoRow icon={User} label="Service Advisor" value={job.serviceAdvisorId?.name} />
            <InfoRow
              icon={Wrench}
              label="Assigned Mechanic"
              value={
                job.assignedMechanicId
                  ? job.assignedMechanicId.userId?.name ||
                    job.assignedMechanicId.employeeCode ||
                    'Mechanic'
                  : 'Not yet assigned'
              }
            />
            <InfoRow icon={Gauge} label="Odometer In" value={job.odometerIn ? `${job.odometerIn.toLocaleString('en-IN')} km` : null} />
            <InfoRow icon={Truck} label="Check-In" value={formatDateTime(job.checkInAt)} />
            <InfoRow icon={Gauge} label="Work Started" value={formatDateTime(job.startedAt)} />
            <InfoRow icon={ClipboardCheck} label="Completed" value={formatDateTime(job.completedAt)} />
            <InfoRow icon={Truck} label="Expected Completion" value={formatDateTime(job.expectedCompletionAt)} />
          </SectionCard>

          <SectionCard icon={Car} title="Vehicle">
            <InfoRow icon={Car} label="Registration" value={job.vehicleId?.registrationNumber} />
            <InfoRow
              icon={Car}
              label="Model"
              value={job.vehicleId ? `${job.vehicleId.make || ''} ${job.vehicleId.model || ''}`.trim() : null}
            />
            <InfoRow icon={Car} label="Colour" value={job.vehicleId?.color} />
            {job.customerNotes && (
              <div className="mt-4">
                <p
                  className="text-xs font-black uppercase tracking-widest mb-1.5"
                  style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Your Notes
                </p>
                <p className="text-sm" style={{ color: MUTED }}>{job.customerNotes}</p>
              </div>
            )}
          </SectionCard>
        </div>

        <SectionCard
          icon={FileText}
          title="Estimate"
          action={estimate ? <StatusBadge status={estimate.status} /> : null}
        >
          {!estimate ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No estimate yet. The service advisor will share a cost breakdown once the inspection is
              complete.
            </p>
          ) : (
            <div>
              <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                <table className="w-full text-left min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      {['Item', 'Qty', 'Unit Price', 'Total'].map((h) => (
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
                    {(estimate.items || []).map((item, index) => (
                      <tr key={index} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                          {item.name}
                          {item.description && (
                            <p className="text-xs" style={{ color: MUTED }}>{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{rupees(item.unitPrice)}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                          {rupees((item.quantity || 1) * (item.unitPrice || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col items-end gap-1 mt-3 text-sm">
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Subtotal</span>
                  <span style={{ color: FOREGROUND }}>{rupees(subtotal)}</span>
                </div>
                {Number(estimate.pricing?.discount) > 0 && (
                  <div className="flex items-center gap-6" style={{ color: '#10b981' }}>
                    <span>Discount</span>
                    <span>− {rupees(estimate.pricing.discount)}</span>
                  </div>
                )}
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Tax</span>
                  <span style={{ color: FOREGROUND }}>{rupees(estimate.pricing?.tax)}</span>
                </div>
                <div
                  className="flex items-center gap-6 text-base font-black"
                  style={{ borderTop: `1px solid ${LINE_STRONG}`, paddingTop: '0.5rem' }}
                >
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Total</span>
                  <span style={{ color: ACCENT }}>{rupees(estimateTotal)}</span>
                </div>
              </div>

              {estimate.customerResponse?.respondedAt && (
                <p className="text-xs mt-3" style={{ color: MUTED }}>
                  You {estimate.status.toLowerCase() === 'approved' ? 'approved' : 'rejected'} this on{' '}
                  {formatDateTime(estimate.customerResponse.respondedAt)}
                  {estimate.customerResponse.remarks ? ` — "${estimate.customerResponse.remarks}"` : ''}
                </p>
              )}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={ListChecks}
          title={`Work Tasks (${tasks.length})`}
          action={
            <button
              type="button"
              onClick={() => navigate('/reviews')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              <Star size={13} />
              Leave a Review
            </button>
          }
        >
          {tasks.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              The task checklist has not been created yet.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                  style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>{task.description}</p>
                    )}
                    <p className="text-[11px] mt-1 uppercase tracking-widest" style={{ color: MUTED }}>
                      {task.taskType}
                      {task.assignedMechanicId?.userId?.name ? ` · ${task.assignedMechanicId.userId.name}` : ''}
                      {task.estimatedMinutes ? ` · ~${task.estimatedMinutes} min` : ''}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard icon={ClipboardCheck} title={`Inspection Reports (${inspections.length})`}>
          {inspections.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No inspection has been recorded for this job yet.
            </p>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <div key={inspection._id} style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE, padding: '1rem' }}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-black"
                        style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {inspection.inspectionType}
                      </span>
                      <StatusBadge status={inspection.status} />
                    </div>
                    <span className="text-xs" style={{ color: MUTED }}>
                      {inspection.inspectorId?.name || 'Inspector'} · {formatDateTime(inspection.completedAt || inspection.createdAt)}
                    </span>
                  </div>

                  {(inspection.odometerReading != null || inspection.fuelLevel != null || inspection.exteriorCondition || inspection.interiorCondition) && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                      {inspection.odometerReading != null && (
                        <div>
                          <p className="uppercase tracking-widest" style={{ color: MUTED }}>Odometer</p>
                          <p style={{ color: FOREGROUND }}>{inspection.odometerReading.toLocaleString('en-IN')} km</p>
                        </div>
                      )}
                      {inspection.fuelLevel != null && (
                        <div>
                          <p className="uppercase tracking-widest" style={{ color: MUTED }}>Fuel</p>
                          <p style={{ color: FOREGROUND }}>{inspection.fuelLevel}%</p>
                        </div>
                      )}
                      {inspection.exteriorCondition && (
                        <div>
                          <p className="uppercase tracking-widest" style={{ color: MUTED }}>Exterior</p>
                          <p style={{ color: FOREGROUND }}>{inspection.exteriorCondition}</p>
                        </div>
                      )}
                      {inspection.interiorCondition && (
                        <div>
                          <p className="uppercase tracking-widest" style={{ color: MUTED }}>Interior</p>
                          <p style={{ color: FOREGROUND }}>{inspection.interiorCondition}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {(inspection.items || []).length > 0 && (
                    <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                      <table className="w-full text-left min-w-[420px]">
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                            {['Component', 'Condition', 'Recommended Action'].map((h) => (
                              <th
                                key={h}
                                className="px-3 py-2 text-[11px] font-bold uppercase tracking-widest"
                                style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {inspection.items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                              <td className="px-3 py-2 text-sm" style={{ color: FOREGROUND }}>
                                {item.component}
                                {item.notes && (
                                  <p className="text-xs" style={{ color: MUTED }}>{item.notes}</p>
                                )}
                              </td>
                              <td
                                className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: CONDITION_COLORS[item.condition] || MUTED }}
                              >
                                {String(item.condition || '').replace(/_/g, ' ')}
                              </td>
                              <td className="px-3 py-2 text-sm" style={{ color: MUTED }}>
                                {item.recommendedAction || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {inspection.notes && (
                    <p className="text-xs mt-3" style={{ color: MUTED }}>{inspection.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard
          icon={CreditCard}
          title="Invoices & Payment"
          action={
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              All Invoices
            </button>
          }
        >
          {invoices.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No invoice has been raised for this job yet. You will be able to pay online once the
              workshop issues it.
            </p>
          ) : (
            <div className="space-y-3">
              {invoices.map((invoice) => {
                const due = invoice.paymentSummary?.outstandingAmount ?? invoice.pricing?.grandTotal ?? 0
                const payable = ['ISSUED', 'PARTIALLY_PAID'].includes(invoice.status) && Number(due) > 0
                return (
                  <div
                    key={invoice._id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
                    style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
                  >
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span
                          className="text-sm font-black"
                          style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                        >
                          {invoice.invoiceNumber}
                        </span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <p className="text-xs mt-1" style={{ color: MUTED }}>
                        Grand total {rupees(invoice.pricing?.grandTotal)}
                        {Number(due) > 0 ? ` · Outstanding ${rupees(due)}` : ' · Fully paid'}
                      </p>
                    </div>
                    {payable && (
                      <button
                        type="button"
                        onClick={() => handlePay(invoice)}
                        disabled={paying}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 self-start"
                        style={primaryButtonStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                      >
                        <CreditCard size={13} />
                        {paying ? 'Processing...' : `Pay ${rupees(due)}`}
                      </button>
                    )}
                  </div>
                )
              })}

              {payableInvoice && !keyId && (
                <p className="text-xs" style={{ color: MUTED }}>
                  Razorpay key is not configured. Add{' '}
                  <span style={{ color: ACCENT }}>VITE_RAZORPAY_KEY_ID</span> to Client/.env to enable
                  online payment.
                </p>
              )}

              {payError && (
                <div
                  className="px-3 py-2.5 text-sm"
                  style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
                >
                  {payError}
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {invoices.length === 0 && job.status === 'COMPLETED' && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/reviews')}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Star size={14} />
              Rate this service
            </button>
          </div>
        )}
      </div>

      <Modal open={respondOpen} onClose={() => setRespondOpen(false)} title="Respond to Estimate">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: MUTED }}>
            Approving authorises the workshop to begin work on your vehicle. Rejecting sends the
            estimate back to the service advisor for revision.
          </p>
          <TextArea
            label="Remarks (optional)"
            rows={2}
            value={respondRemarks}
            onChange={(e) => setRespondRemarks(e.target.value)}
            placeholder="Anything we should adjust?"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRespondOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleRespond('REJECTED')}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-50"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              <ThumbsDown size={13} />
              Reject
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleRespond('APPROVED')}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <ThumbsUp size={13} />
              Approve
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
