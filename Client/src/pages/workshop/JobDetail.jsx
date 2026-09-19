import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ClipboardList,
  CheckCircle2,
  User,
  Truck,
  ClipboardCheck,
  Gauge,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
  TextArea,
  TextInput,
} from '../../components/Field'
import {
  getJob,
  updateJobStatus,
  checkInJob,
  assignMechanic,
} from '../../services/jobApi'
import { listMechanics } from '../../services/masterApi'
import { formatDateTime } from '../../utils/transitions'
import { JOB_NEXT_STATUS } from '../../utils/transitions'
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

const TASK_ACTIONS = {
  CHECK_IN: { label: 'Check In Vehicle', icon: Truck },
  INSPECTION: { label: 'Start Inspection', icon: ClipboardCheck },
  ESTIMATE_PENDING: { label: 'Send for Estimate', icon: ClipboardList },
  APPROVED: { label: 'Assign to Mechanic', icon: User },
  IN_PROGRESS: { label: 'Begin Work', icon: Gauge },
  DELIVERED: { label: 'Deliver Vehicle', icon: Truck },
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

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusHover, setStatusHover] = useState(null)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [mechanics, setMechanics] = useState([])
  const [mechanicsLoaded, setMechanicsLoaded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const [checkInForm, setCheckInForm] = useState({ odometerIn: '', customerNotes: '', internalNotes: '' })
  const [assignForm, setAssignForm] = useState({ mechanicId: '' })

  const load = async () => {
    try {
      const res = await getJob(jobId)
      setJob(res.data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    getJob(jobId)
      .then((res) => { if (!cancelled) setJob(res.data) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [jobId])

  useEffect(() => {
    if (!job?.workshopId?._id || mechanicsLoaded) return
    listMechanics({ workshopId: job.workshopId._id, limit: 100 })
      .then((res) => {
        const list = res.data?.mechanics || res.data || []
        setMechanics(Array.isArray(list) ? list : [])
      })
      .catch(() => setMechanics([]))
      .finally(() => setMechanicsLoaded(true))
  }, [job, mechanicsLoaded])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AppNav />
        <Spinner label="Loading job..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AppNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: MUTED }}>Job not found.</p>
          <button
            type="button"
            onClick={() => navigate('/workshop/jobs')}
            className="mt-4 px-6 py-3 text-xs font-black uppercase tracking-widest"
            style={primaryButtonStyle}
          >
            Back to Job Board
          </button>
        </div>
      </div>
    )
  }

  const pipelineIndex = PIPELINE.indexOf(job.status)
  const currentIndex = pipelineIndex === -1 ? -1 : pipelineIndex
  const nextStatuses = JOB_NEXT_STATUS[job.status] || []

  const handleStatus = async (status) => {
    setUpdating(true)
    try {
      await updateJobStatus(job._id, { status })
      toast.success(`Job moved to ${status.replace(/_/g, ' ')}`)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCheckIn = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await checkInJob(job._id, {
        odometerIn: checkInForm.odometerIn ? Number(checkInForm.odometerIn) : undefined,
        customerNotes: checkInForm.customerNotes || undefined,
        internalNotes: checkInForm.internalNotes || undefined,
      })
      toast.success('Vehicle checked in')
      setCheckInOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await assignMechanic(job._id, { mechanicId: assignForm.mechanicId })
      toast.success('Mechanic assigned')
      setAssignOpen(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const defaultAction = JOB_NEXT_STATUS[job.status]?.[0]

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/workshop/jobs')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={14} />
          Back to Job Board
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                {job.jobNumber}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Booking {job.bookingId?.bookingNumber} · Created {formatDateTime(job.createdAt)}
            </p>
          </div>

          {defaultAction && (
            <button
              type="button"
              disabled={updating}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              onClick={() => {
                if (defaultAction === 'CHECK_IN') setCheckInOpen(true)
                else if (defaultAction === 'APPROVED') setAssignOpen(true)
                else handleStatus(defaultAction)
              }}
            >
              {job.status === 'CREATED' ? <Truck size={16} /> : <CheckCircle2 size={16} />}
              {job.status === 'CREATED'
                ? 'Check In Vehicle'
                : TASK_ACTIONS[job.status]?.label || `Move to ${defaultAction.replace(/_/g, ' ')}`}
            </button>
          )}
        </div>

        {/* Pipeline */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <h2
            className="text-base font-black uppercase tracking-widest mb-5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
          >
            Workflow Progress
          </h2>
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
                    <div className="flex-1 mt-3.5 mx-1" style={{ height: 2, background: i < currentIndex ? ACCENT : LINE_STRONG }} />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Next status actions */}
        {nextStatuses.length > 0 && (
          <section
            className="p-4"
            style={{ border: `1px solid ${ACCENT}`, background: 'rgba(217,79,61,0.05)' }}
          >
            <p className="text-xs uppercase tracking-widest mb-3" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
              Advance to next stage
            </p>
            <div className="flex flex-wrap gap-2">
              {nextStatuses.map((next) => (
                <button
                  key={next}
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    if (next === 'CHECK_IN') setCheckInOpen(true)
                    else if (next === 'APPROVED') setAssignOpen(true)
                    else handleStatus(next)
                  }}
                  className="px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
                  style={{
                    ...ghostButtonStyle,
                    borderColor: statusHover === next ? ACCENT : LINE_STRONG,
                    color: statusHover === next ? ACCENT : MUTED,
                  }}
                  onMouseEnter={() => setStatusHover(next)}
                  onMouseLeave={() => setStatusHover(null)}
                >
                  {next.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job info */}
          <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
            <h2
              className="text-base font-black uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Job Details
            </h2>
            <InfoRow icon={User} label="Customer" value={job.customerId?.name} />
            <InfoRow icon={ClipboardList} label="Booking" value={job.bookingId?.bookingNumber} />
            <InfoRow icon={User} label="Service Advisor" value={job.serviceAdvisorId?.name} />
            <InfoRow icon={Gauge} label="Odometer In" value={job.odometerIn ? `${job.odometerIn.toLocaleString()} km` : null} />
            <InfoRow icon={Gauge} label="Odometer Out" value={job.odometerOut ? `${job.odometerOut.toLocaleString()} km` : null} />
            <InfoRow icon={User} label="Assigned Mechanic" value={job.assignedMechanicId ? (job.assignedMechanicId.userId?.name || job.assignedMechanicId.employeeCode) : 'Unassigned'} />
            <InfoRow icon={Truck} label="Check-In" value={formatDateTime(job.checkInAt)} />
            <InfoRow icon={Gauge} label="Started" value={formatDateTime(job.startedAt)} />
            <InfoRow icon={ClipboardCheck} label="Completed" value={formatDateTime(job.completedAt)} />
            <InfoRow icon={Truck} label="Expected Completion" value={formatDateTime(job.expectedCompletionAt)} />
          </section>

          {/* Vehicle + notes */}
          <section className="space-y-6">
            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
              <h2
                className="text-base font-black uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Vehicle
              </h2>
              <InfoRow icon={ClipboardList} label="Registration" value={job.vehicleId?.registrationNumber} />
              <InfoRow icon={ClipboardList} label="Model" value={job.vehicleId ? `${job.vehicleId.make} ${job.vehicleId.model}` : null} />
              <InfoRow icon={ClipboardList} label="Colour" value={job.vehicleId?.color} />
            </section>

            {job.customerNotes && (
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
                <h2
                  className="text-base font-black uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  Customer Notes
                </h2>
                <p className="text-sm" style={{ color: MUTED }}>{job.customerNotes}</p>
              </section>
            )}

            {job.internalNotes && (
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE, padding: '1.25rem' }}>
                <h2
                  className="text-base font-black uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  Internal Notes
                </h2>
                <p className="text-sm" style={{ color: MUTED }}>{job.internalNotes}</p>
              </section>
            )}
          </section>
        </div>
      </div>

      {/* Check-in modal */}
      <Modal open={checkInOpen} onClose={() => setCheckInOpen(false)} title="Check In Vehicle">
        <form onSubmit={handleCheckIn} className="space-y-4" noValidate>
          <TextInput
            label="Odometer Reading (km)"
            type="number"
            min={0}
            value={checkInForm.odometerIn}
            onChange={(e) => setCheckInForm((s) => ({ ...s, odometerIn: e.target.value }))}
            placeholder="24500"
          />
          <TextArea
            label="Customer Notes"
            rows={2}
            value={checkInForm.customerNotes}
            onChange={(e) => setCheckInForm((s) => ({ ...s, customerNotes: e.target.value }))}
            placeholder="Condition as reported by customer"
          />
          <TextArea
            label="Internal Notes"
            rows={2}
            value={checkInForm.internalNotes}
            onChange={(e) => setCheckInForm((s) => ({ ...s, internalNotes: e.target.value }))}
            placeholder="Notes for the workshop team"
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCheckInOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              {updating ? 'Saving...' : 'Confirm Check-In'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign mechanic modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title="Assign Mechanic">
        <form onSubmit={handleAssign} className="space-y-4" noValidate>
          <SelectInput
            label="Mechanic"
            required
            placeholder={
              mechanics.length
                ? 'Select a mechanic'
                : 'No mechanics loaded — enter a mechanic _id'
            }
            value={assignForm.mechanicId}
            onChange={(e) => setAssignForm({ mechanicId: e.target.value })}
          >
            {mechanics.map((m) => (
              <option key={m._id} value={m._id} style={{ background: PANEL }}>
                {m.userId?.name || m.employeeCode} {m.specialization?.length ? `— ${m.specialization.join(', ')}` : ''}
              </option>
            ))}
          </SelectInput>
          {mechanics.length === 0 && (
            <TextInput
              label="Mechanic ID (manual)"
              value={assignForm.mechanicId}
              onChange={(e) => setAssignForm({ mechanicId: e.target.value })}
              placeholder="Paste mechanic _id"
            />
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAssignOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !assignForm.mechanicId}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              {updating ? 'Assigning...' : 'Assign Mechanic'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}