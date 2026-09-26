import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Truck,
  Gauge,
  Camera,
  FileText,
  Trash2,
  ImageIcon,
  ClipboardList,
  ClipboardCheck,
  ListChecks,
  Package,
  Plus,
} from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { SelectInput, TextInput, TextArea } from '../../components/Field'
import { getJob } from '../../services/jobApi'
import { getEstimate } from '../../services/estimateApi'
import { uploadJobMedia, listJobMedia, deleteMedia } from '../../services/mediaApi'
import { listInspections, createInspection, completeInspection } from '../../services/inspectionApi'
import { listJobTasks, createJobTask, updateJobTaskStatus, deleteJobTask } from '../../services/jobTaskApi'
import { listJobParts, createJobPart, updateJobPartStatus, deleteJobPart } from '../../services/jobPartApi'
import { listInventoryParts } from '../../services/inventoryApi'
import { formatDateTime, JOB_TASK_NEXT_STATUS, JOB_PART_NEXT_STATUS } from '../../utils/transitions'
import {
  ACCENT,
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

const TASK_TYPES = ['REPAIR', 'DETAILING', 'INSPECTION', 'MAINTENANCE']
const INSPECTION_TYPES = ['INITIAL', 'FINAL', 'REINSPECTION']

const EMPTY_INSPECTION_FORM = {
  inspectionType: 'INITIAL',
  odometerReading: '',
  fuelLevel: '',
  exteriorCondition: '',
  interiorCondition: '',
  notes: '',
}

const EMPTY_TASK_FORM = { title: '', taskType: 'REPAIR', estimatedMinutes: '', description: '' }

const EMPTY_PART_FORM = { inventoryPartId: '', quantity: '1' }


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

function SectionHeader({ icon: Icon, title, count, actionLabel, onAction, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-3">
        <Icon size={18} style={{ color: ACCENT }} />
        <h2
          className="text-base font-black uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
        >
          {title}
        </h2>
        <span className="text-xs" style={{ color: MUTED }}>({count})</span>
      </div>
      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={ghostButtonStyle}
          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
        >
          <Plus size={13} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const [estimate, setEstimate] = useState(null)
  const [media, setMedia] = useState([])
  const [uploadCategory, setUploadCategory] = useState('BEFORE')
  const [uploadingImage, setUploadingImage] = useState(false)

  const [inspections, setInspections] = useState([])
  const [tasks, setTasks] = useState([])
  const [parts, setParts] = useState([])
  const [inventoryOptions, setInventoryOptions] = useState([])
  const [workSubmitting, setWorkSubmitting] = useState(false)

  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [inspectionForm, setInspectionForm] = useState(EMPTY_INSPECTION_FORM)

  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM)
  const [taskStatusTarget, setTaskStatusTarget] = useState(null)
  const [taskStatusForm, setTaskStatusForm] = useState({ status: '', blockedReason: '', actualMinutes: '' })

  const [partOpen, setPartOpen] = useState(false)
  const [partForm, setPartForm] = useState(EMPTY_PART_FORM)
  const [partStatusTarget, setPartStatusTarget] = useState(null)
  const [partStatusForm, setPartStatusForm] = useState({ status: '' })

  useEffect(() => {
    let cancelled = false
    getJob(jobId)
      .then((res) => { if (!cancelled) setJob(res.data) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [jobId])

  useEffect(() => {
    if (!job?._id) return
    let cancelled = false
    getEstimate(jobId)
      .then((res) => { if (!cancelled) setEstimate(res.data) })
      .catch(() => { if (!cancelled) setEstimate(null) })
    listJobMedia(jobId)
      .then((res) => { if (!cancelled) setMedia(res.data || []) })
      .catch(() => { if (!cancelled) setMedia([]) })
    listInspections({ jobId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => { if (!cancelled) setInspections(res.data?.inspections || []) })
      .catch(() => { if (!cancelled) setInspections([]) })
    listJobTasks(jobId, { limit: 100, sortBy: 'sequence', sortOrder: 'asc' })
      .then((res) => { if (!cancelled) setTasks(res.data?.tasks || []) })
      .catch(() => { if (!cancelled) setTasks([]) })
    listJobParts(jobId, { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => { if (!cancelled) setParts(res.data?.parts || []) })
      .catch(() => { if (!cancelled) setParts([]) })
    return () => { cancelled = true }
  }, [job?._id, jobId])

  useEffect(() => {
    if (!job?.workshopId) return
    let cancelled = false
    const workshopId = typeof job.workshopId === 'object' ? job.workshopId._id : job.workshopId
    listInventoryParts({ workshopId, limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((res) => { if (!cancelled) setInventoryOptions(res.data?.parts || []) })
      .catch(() => { if (!cancelled) setInventoryOptions([]) })
    return () => { cancelled = true }
  }, [job?.workshopId])

  const reloadWorkData = async () => {
    try {
      const [insRes, taskRes, partRes] = await Promise.all([
        listInspections({ jobId, limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
        listJobTasks(jobId, { limit: 100, sortBy: 'sequence', sortOrder: 'asc' }),
        listJobParts(jobId, { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' }),
      ])
      setInspections(insRes.data?.inspections || [])
      setTasks(taskRes.data?.tasks || [])
      setParts(partRes.data?.parts || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openInspection = () => {
    setInspectionForm(EMPTY_INSPECTION_FORM)
    setInspectionOpen(true)
  }

  const handleInspection = async (e) => {
    e.preventDefault()
    setWorkSubmitting(true)
    try {
      await createInspection({
        jobId,
        inspectionType: inspectionForm.inspectionType,
        odometerReading: inspectionForm.odometerReading !== '' ? Number(inspectionForm.odometerReading) : undefined,
        fuelLevel: inspectionForm.fuelLevel !== '' ? Number(inspectionForm.fuelLevel) : undefined,
        exteriorCondition: inspectionForm.exteriorCondition.trim() || undefined,
        interiorCondition: inspectionForm.interiorCondition.trim() || undefined,
        notes: inspectionForm.notes.trim() || undefined,
      })
      toast.success('Inspection created')
      setInspectionOpen(false)
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const handleCompleteInspection = async (inspection) => {
    setWorkSubmitting(true)
    try {
      await completeInspection(inspection._id)
      toast.success('Inspection completed')
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const openTask = () => {
    setTaskForm(EMPTY_TASK_FORM)
    setTaskOpen(true)
  }

  const handleTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      toast.error('Task title is required')
      return
    }
    setWorkSubmitting(true)
    try {
      await createJobTask(jobId, {
        title: taskForm.title.trim(),
        taskType: taskForm.taskType,
        description: taskForm.description.trim() || undefined,
        estimatedMinutes: taskForm.estimatedMinutes !== '' ? Number(taskForm.estimatedMinutes) : undefined,
      })
      toast.success('Task added')
      setTaskOpen(false)
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const openTaskStatus = (task) => {
    const next = (JOB_TASK_NEXT_STATUS[task.status] || [])[0] || ''
    setTaskStatusTarget(task)
    setTaskStatusForm({ status: next, blockedReason: '', actualMinutes: '' })
  }

  const handleTaskStatus = async (e) => {
    e.preventDefault()
    if (!taskStatusForm.status) {
      toast.error('Select the next status')
      return
    }
    setWorkSubmitting(true)
    try {
      await updateJobTaskStatus(jobId, taskStatusTarget._id, {
        status: taskStatusForm.status,
        blockedReason: taskStatusForm.status === 'BLOCKED' ? taskStatusForm.blockedReason.trim() || undefined : undefined,
        actualMinutes: taskStatusForm.status === 'COMPLETED' && taskStatusForm.actualMinutes !== ''
          ? Number(taskStatusForm.actualMinutes)
          : undefined,
      })
      toast.success('Task status updated')
      setTaskStatusTarget(null)
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const handleDeleteTask = async (task) => {
    setWorkSubmitting(true)
    try {
      await deleteJobTask(jobId, task._id)
      toast.success('Task removed')
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const openPart = () => {
    setPartForm(EMPTY_PART_FORM)
    setPartOpen(true)
  }

  const handlePart = async (e) => {
    e.preventDefault()
    if (!partForm.inventoryPartId) {
      toast.error('Select an inventory part')
      return
    }
    setWorkSubmitting(true)
    try {
      await createJobPart(jobId, {
        inventoryPartId: partForm.inventoryPartId,
        quantity: Number(partForm.quantity) || 1,
      })
      toast.success('Part reserved for this job')
      setPartOpen(false)
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const openPartStatus = (part) => {
    const next = (JOB_PART_NEXT_STATUS[part.status] || [])[0] || ''
    setPartStatusTarget(part)
    setPartStatusForm({ status: next })
  }

  const handlePartStatus = async (e) => {
    e.preventDefault()
    if (!partStatusForm.status) {
      toast.error('Select the next status')
      return
    }
    setWorkSubmitting(true)
    try {
      await updateJobPartStatus(jobId, partStatusTarget._id, { status: partStatusForm.status })
      toast.success('Part status updated')
      setPartStatusTarget(null)
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }

  const handleDeletePart = async (part) => {
    setWorkSubmitting(true)
    try {
      await deleteJobPart(jobId, part._id)
      toast.success('Part removed')
      reloadWorkData()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setWorkSubmitting(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <Spinner label="Loading job..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: MUTED }}>Job not found.</p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
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

  const currentIndex = PIPELINE.indexOf(job.status)
  const subtotal = (estimate?.items || []).reduce(
    (s, i) => s + ((i.quantity || 1) * (i.unitPrice || 0)),
    0,
  )
  const discount = estimate?.pricing?.discount || 0
  const tax = estimate?.pricing?.tax || 0
  const total = estimate?.pricing?.total ?? (subtotal - discount + tax)

  const beforePhotos = media.filter((m) => m.category === 'BEFORE')
  const afterPhotos = media.filter((m) => m.category === 'AFTER')
  const otherPhotos = media.filter((m) => m.category !== 'BEFORE' && m.category !== 'AFTER')

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      await uploadJobMedia(job._id, file, uploadCategory)
      toast.success(`${uploadCategory} photo uploaded`)
      const res = await listJobMedia(job._id)
      setMedia(res.data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (mediaId) => {
    try {
      await deleteMedia(mediaId)
      toast.success('Photo deleted')
      const res = await listJobMedia(job._id)
      setMedia(res.data || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const renderPhotoSection = (title, items) => (
    <div>
      <h3
        className="text-sm font-black uppercase tracking-widest mb-3"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: MUTED }}>No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m) => (
            <div key={m._id} className="relative group" style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}>
              <img src={m.url} alt={m.category} className="w-full h-28 sm:h-32 object-cover" />
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>
                  {formatDateTime(m.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(m._id)}
                  className="p-1 cursor-pointer transition-colors"
                  style={{ color: MUTED, background: 'transparent', border: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = MUTED }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/jobs')}
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
            {job.jobNumber}
          </h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm" style={{ color: MUTED }}>
          Booking {job.bookingId?.bookingNumber} · Created {formatDateTime(job.createdAt)}
        </p>

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
            <InfoRow icon={User} label="Contact" value={job.customerId?.phone} />
            <InfoRow icon={ClipboardList} label="Booking" value={job.bookingId?.bookingNumber} />
            <InfoRow icon={ClipboardList} label="Workshop" value={job.workshopId?.name} />
            <InfoRow icon={User} label="Service Advisor" value={job.serviceAdvisorId?.name} />
            <InfoRow icon={User} label="Workshop Manager" value={job.workshopManagerId?.name} />
            <InfoRow icon={User} label="Assigned Mechanic" value={job.assignedMechanicId ? (job.assignedMechanicId.userId?.name ? `${job.assignedMechanicId.employeeCode} (${job.assignedMechanicId.userId.name})` : (job.assignedMechanicId.employeeCode || 'Mechanic')) : 'Unassigned'} />
            <InfoRow icon={Gauge} label="Odometer In" value={job.odometerIn ? `${job.odometerIn.toLocaleString()} km` : null} />
            <InfoRow icon={Gauge} label="Odometer Out" value={job.odometerOut ? `${job.odometerOut.toLocaleString()} km` : null} />
            <InfoRow icon={Truck} label="Check-In" value={formatDateTime(job.checkInAt)} />
            <InfoRow icon={Gauge} label="Started" value={formatDateTime(job.startedAt)} />
            <InfoRow icon={CheckCircle2} label="Completed" value={formatDateTime(job.completedAt)} />
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

        {/* Estimate */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={18} style={{ color: ACCENT }} />
            <h2
              className="text-base font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Estimate
            </h2>
            {estimate && <StatusBadge status={estimate.status} />}
          </div>

          {!estimate ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No estimate has been created for this job yet.
            </p>
          ) : (
            <div>
              <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      {['Item', 'Type', 'Qty', 'Unit Price', 'Total'].map((h) => (
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
                    {(estimate.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                          {item.name}
                          {item.description && (
                            <p className="text-xs" style={{ color: MUTED }}>{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{item.type}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>₹{item.unitPrice?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                          ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end gap-1 mt-3 text-sm">
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Subtotal</span>
                  <span style={{ color: FOREGROUND }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-6" style={{ color: '#10b981' }}>
                    <span>Discount</span>
                    <span>- ₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Tax</span>
                  <span style={{ color: FOREGROUND }}>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-6 text-base font-black" style={{ color: FOREGROUND, borderTop: `1px solid ${LINE_STRONG}`, paddingTop: '0.5rem' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Total</span>
                  <span style={{ color: ACCENT }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              {estimate.customerResponse?.respondedAt && (
                <p className="text-xs mt-3" style={{ color: MUTED }}>
                  Customer {estimate.status.toLowerCase() === 'approved' ? 'approved' : 'rejected'} this on{' '}
                  {formatDateTime(estimate.customerResponse.respondedAt)}
                  {estimate.customerResponse.remarks ? ` — "${estimate.customerResponse.remarks}"` : ''}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Inspections */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <SectionHeader
            icon={ClipboardCheck}
            title="Inspections"
            count={inspections.length}
            actionLabel="New Inspection"
            onAction={openInspection}
          />
          {inspections.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>No inspections recorded for this job yet.</p>
          ) : (
            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['Type', 'Inspector', 'Odometer', 'Fuel', 'Items', 'Status', 'Created', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((ins) => (
                    <tr key={ins._id} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>{ins.inspectionType}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{ins.inspectorId?.name || '—'}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                        {ins.odometerReading != null ? `${ins.odometerReading.toLocaleString('en-IN')} km` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                        {ins.fuelLevel != null ? `${ins.fuelLevel}%` : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{ins.items?.length || 0}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={ins.status} /></td>
                      <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                        {formatDateTime(ins.createdAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleCompleteInspection(ins)}
                          disabled={ins.status === 'COMPLETED' || workSubmitting}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <CheckCircle2 size={11} />
                          Complete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Job tasks */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <SectionHeader
            icon={ListChecks}
            title="Job Tasks"
            count={tasks.length}
            actionLabel="Add Task"
            onAction={openTask}
          />
          {tasks.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>No tasks have been added to this job yet.</p>
          ) : (
            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['#', 'Task', 'Type', 'Assigned', 'Estimate', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => {
                    const nextStatuses = JOB_TASK_NEXT_STATUS[task.status] || []
                    return (
                      <tr key={task._id} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{task.sequence ?? '—'}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                          {task.title}
                          {task.description && <p className="text-xs" style={{ color: MUTED }}>{task.description}</p>}
                          {task.blockedReason && <p className="text-xs" style={{ color: '#f87171' }}>{task.blockedReason}</p>}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{task.taskType}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                          {task.assignedMechanicId?.userId?.name || task.assignedMechanicId?.employeeCode || 'Unassigned'}
                        </td>
                        <td className="px-4 py-2.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                          {task.estimatedMinutes != null ? `${task.estimatedMinutes} min` : '—'}
                        </td>
                        <td className="px-4 py-2.5"><StatusBadge status={task.status} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openTaskStatus(task)}
                              disabled={nextStatuses.length === 0}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              style={ghostButtonStyle}
                              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                            >
                              Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task)}
                              disabled={workSubmitting}
                              className="inline-flex items-center justify-center p-1.5 text-[11px] cursor-pointer disabled:opacity-30"
                              style={ghostButtonStyle}
                              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Job parts */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <SectionHeader
            icon={Package}
            title="Parts Used"
            count={parts.length}
            actionLabel="Reserve Part"
            onAction={openPart}
            disabled={inventoryOptions.length === 0}
          />
          {parts.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>No parts have been reserved for this job yet.</p>
          ) : (
            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
              <table className="w-full text-left">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['Part', 'Category', 'Qty', 'Unit Price', 'Total', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap"
                        style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parts.map((part) => {
                    const nextStatuses = JOB_PART_NEXT_STATUS[part.status] || []
                    return (
                      <tr key={part._id} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5">
                          <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                            {part.inventoryPartId?.partNumber || '—'}
                          </span>
                          <p className="text-xs" style={{ color: FOREGROUND }}>{part.inventoryPartId?.name || ''}</p>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{part.inventoryPartId?.category || '—'}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{part.quantity}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                          ₹{(part.unitPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                          ₹{(part.totalPrice || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2.5"><StatusBadge status={part.status} /></td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openPartStatus(part)}
                              disabled={nextStatuses.length === 0}
                              className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              style={ghostButtonStyle}
                              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                            >
                              Status
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePart(part)}
                              disabled={workSubmitting}
                              className="inline-flex items-center justify-center p-1.5 text-[11px] cursor-pointer disabled:opacity-30"
                              style={ghostButtonStyle}
                              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Before / After photos */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ImageIcon size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Work Photos
              </h2>
            </div>
            <label
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              <Camera size={13} />
              {uploadingImage ? 'Uploading...' : 'Add Photo'}
              {!uploadingImage && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  name="photo"
                  onChange={handleUploadPhoto}
                />
              )}
            </label>
          </div>
          <div className="mb-5">
            <SelectInput
              label="Photo Category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="BEFORE" style={{ background: PANEL }}>Before Work</option>
              <option value="AFTER" style={{ background: PANEL }}>After Work</option>
              <option value="DAMAGE" style={{ background: PANEL }}>Damage</option>
              <option value="INSPECTION" style={{ background: PANEL }}>Inspection</option>
            </SelectInput>
          </div>
          <div className="space-y-6">
            {renderPhotoSection(`Before Work (${beforePhotos.length})`, beforePhotos)}
            {renderPhotoSection(`After Work (${afterPhotos.length})`, afterPhotos)}
            {otherPhotos.length > 0 && renderPhotoSection(`Other (${otherPhotos.length})`, otherPhotos)}
          </div>
        </section>
      </div>

      <Modal
        open={inspectionOpen}
        onClose={() => setInspectionOpen(false)}
        title="New Inspection"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleInspection} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectInput
              label="Inspection Type"
              required
              value={inspectionForm.inspectionType}
              onChange={(e) => setInspectionForm((s) => ({ ...s, inspectionType: e.target.value }))}
            >
              {INSPECTION_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>{t}</option>
              ))}
            </SelectInput>
            <TextInput
              label="Odometer (km)"
              type="number"
              min={0}
              value={inspectionForm.odometerReading}
              onChange={(e) => setInspectionForm((s) => ({ ...s, odometerReading: e.target.value }))}
            />
            <TextInput
              label="Fuel Level (%)"
              type="number"
              min={0}
              max={100}
              value={inspectionForm.fuelLevel}
              onChange={(e) => setInspectionForm((s) => ({ ...s, fuelLevel: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea
              label="Exterior Condition"
              rows={3}
              value={inspectionForm.exteriorCondition}
              onChange={(e) => setInspectionForm((s) => ({ ...s, exteriorCondition: e.target.value }))}
            />
            <TextArea
              label="Interior Condition"
              rows={3}
              value={inspectionForm.interiorCondition}
              onChange={(e) => setInspectionForm((s) => ({ ...s, interiorCondition: e.target.value }))}
            />
          </div>
          <TextArea
            label="Notes"
            rows={3}
            value={inspectionForm.notes}
            onChange={(e) => setInspectionForm((s) => ({ ...s, notes: e.target.value }))}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setInspectionOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={workSubmitting} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {workSubmitting ? 'Creating...' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add Task" maxWidth="max-w-2xl">
        <form onSubmit={handleTask} className="space-y-4" noValidate>
          <TextInput
            label="Task Title"
            required
            value={taskForm.title}
            onChange={(e) => setTaskForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Ceramic coating on bonnet"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Task Type"
              required
              value={taskForm.taskType}
              onChange={(e) => setTaskForm((s) => ({ ...s, taskType: e.target.value }))}
            >
              {TASK_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>{t}</option>
              ))}
            </SelectInput>
            <TextInput
              label="Estimated Minutes"
              type="number"
              min={0}
              value={taskForm.estimatedMinutes}
              onChange={(e) => setTaskForm((s) => ({ ...s, estimatedMinutes: e.target.value }))}
            />
          </div>
          <TextArea
            label="Description"
            rows={3}
            value={taskForm.description}
            onChange={(e) => setTaskForm((s) => ({ ...s, description: e.target.value }))}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTaskOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={workSubmitting} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {workSubmitting ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!taskStatusTarget}
        onClose={() => setTaskStatusTarget(null)}
        title={`Update Task · ${taskStatusTarget?.title || ''}`}
      >
        {taskStatusTarget && (
          <form onSubmit={handleTaskStatus} className="space-y-4" noValidate>
            <SelectInput
              label="Next Status"
              required
              placeholder="Select next status"
              value={taskStatusForm.status}
              onChange={(e) => setTaskStatusForm((s) => ({ ...s, status: e.target.value }))}
            >
              {(JOB_TASK_NEXT_STATUS[taskStatusTarget.status] || []).map((s) => (
                <option key={s} value={s} style={{ background: PANEL }}>{s.replace(/_/g, ' ')}</option>
              ))}
            </SelectInput>
            {taskStatusForm.status === 'BLOCKED' && (
              <TextInput
                label="Blocked Reason"
                required
                value={taskStatusForm.blockedReason}
                onChange={(e) => setTaskStatusForm((s) => ({ ...s, blockedReason: e.target.value }))}
                placeholder="Awaiting replacement part"
              />
            )}
            {taskStatusForm.status === 'COMPLETED' && (
              <TextInput
                label="Actual Minutes"
                type="number"
                min={0}
                value={taskStatusForm.actualMinutes}
                onChange={(e) => setTaskStatusForm((s) => ({ ...s, actualMinutes: e.target.value }))}
              />
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setTaskStatusTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={workSubmitting} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {workSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={partOpen} onClose={() => setPartOpen(false)} title="Reserve Part" maxWidth="max-w-2xl">
        <form onSubmit={handlePart} className="space-y-4" noValidate>
          <SelectInput
            label="Inventory Part"
            required
            placeholder="Select a part"
            value={partForm.inventoryPartId}
            onChange={(e) => setPartForm((s) => ({ ...s, inventoryPartId: e.target.value }))}
          >
            {inventoryOptions.map((part) => (
              <option key={part._id} value={part._id} style={{ background: PANEL }}>
                {part.partNumber} · {part.name}
              </option>
            ))}
          </SelectInput>
          <TextInput
            label="Quantity"
            required
            type="number"
            min={1}
            value={partForm.quantity}
            onChange={(e) => setPartForm((s) => ({ ...s, quantity: e.target.value }))}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPartOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={workSubmitting} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {workSubmitting ? 'Reserving...' : 'Reserve Part'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!partStatusTarget}
        onClose={() => setPartStatusTarget(null)}
        title={`Update Part · ${partStatusTarget?.inventoryPartId?.partNumber || ''}`}
      >
        {partStatusTarget && (
          <form onSubmit={handlePartStatus} className="space-y-4" noValidate>
            <SelectInput
              label="Next Status"
              required
              placeholder="Select next status"
              value={partStatusForm.status}
              onChange={(e) => setPartStatusForm((s) => ({ ...s, status: e.target.value }))}
            >
              {(JOB_PART_NEXT_STATUS[partStatusTarget.status] || []).map((s) => (
                <option key={s} value={s} style={{ background: PANEL }}>{s}</option>
              ))}
            </SelectInput>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPartStatusTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={workSubmitting} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {workSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}