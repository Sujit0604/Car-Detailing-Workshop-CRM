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
  Camera,
  FileText,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  ImageIcon,
  ListChecks,
  Package,
  Plus,
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
import { useAuth } from '../../contexts/authContext'
import {
  getJob,
  updateJobStatus,
  checkInJob,
  assignMechanic,
  getEstimate,
  createEstimate,
  respondToEstimate,
} from '../../services/jobApi'
import {
  uploadJobMedia,
  listJobMedia,
  deleteMedia,
} from '../../services/mediaApi'
import { listMechanics } from '../../services/masterApi'
import { listInventoryParts } from '../../services/inventoryApi'
import {
  listInspections,
  createInspection,
  completeInspection,
} from '../../services/inspectionApi'
import {
  listJobTasks,
  createJobTask,
  updateJobTaskStatus,
  deleteJobTask,
} from '../../services/jobTaskApi'
import { listJobParts, createJobPart, updateJobPartStatus } from '../../services/jobPartApi'
import { formatDateTime } from '../../utils/transitions'
import { getJobActionsForRole } from '../../utils/transitions'
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

const TASK_ACTIONS = {
  CHECK_IN: { label: 'Check In Vehicle', icon: Truck },
  INSPECTION: { label: 'Start Inspection', icon: ClipboardCheck },
  ESTIMATE_PENDING: { label: 'Send for Estimate', icon: ClipboardList },
  APPROVED: { label: 'Assign to Mechanic', icon: User },
  IN_PROGRESS: { label: 'Begin Work', icon: Gauge },
  DELIVERED: { label: 'Deliver Vehicle', icon: Truck },
}

const STAFF_ROLES = ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN']
const PHOTO_ROLES = ['SERVICE_ADVISOR', 'WORKSHOP_MANAGER', 'ADMIN', 'MECHANIC']

const INSPECTION_TYPES = ['INITIAL', 'FINAL', 'REINSPECTION']
const ITEM_CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED', 'REPLACE_REQUIRED']
const TASK_TYPES = ['REPAIR', 'DETAILING', 'INSPECTION', 'MAINTENANCE']
const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']
const PART_STATUSES = ['RESERVED', 'USED', 'RETURNED', 'CANCELLED']

const CONDITION_COLORS = {
  GOOD: '#10b981',
  FAIR: '#f59e0b',
  POOR: '#fb923c',
  DAMAGED: '#f87171',
  REPLACE_REQUIRED: '#ef4444',
}

const EMPTY_INSPECTION_ITEM = { component: '', condition: 'GOOD', notes: '', recommendedAction: '' }
const EMPTY_TASK = { title: '', description: '', taskType: 'REPAIR', assignedMechanicId: '', estimatedMinutes: '' }

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

const EMPTY_ESTIMATE_ITEM = { type: 'LABOUR', name: '', description: '', quantity: 1, unitPrice: '' }

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statusHover, setStatusHover] = useState(null)

  const [checkInOpen, setCheckInOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [mechanics, setMechanics] = useState([])
  const [mechanicsLoaded, setMechanicsLoaded] = useState(false)
  const [checkInForm, setCheckInForm] = useState({ odometerIn: '', customerNotes: '', internalNotes: '' })
  const [assignForm, setAssignForm] = useState({ mechanicId: '' })

  const [media, setMedia] = useState([])
  const [uploadCategory, setUploadCategory] = useState('BEFORE')
  const [uploadingImage, setUploadingImage] = useState(false)

  const [estimate, setEstimate] = useState(null)
  const [estimateOpen, setEstimateOpen] = useState(false)
  const [estimateItems, setEstimateItems] = useState([{ ...EMPTY_ESTIMATE_ITEM }])
  const [estimateDiscount, setEstimateDiscount] = useState('')
  const [estimateTax, setEstimateTax] = useState('')
  const [estimateNotes, setEstimateNotes] = useState('')
  const [respondOpen, setRespondOpen] = useState(false)
  const [respondRemarks, setRespondRemarks] = useState('')

  const [inspections, setInspections] = useState([])
  const [inspectionOpen, setInspectionOpen] = useState(false)
  const [inspectionForm, setInspectionForm] = useState({
    inspectionType: 'INITIAL',
    odometerReading: '',
    fuelLevel: '',
    exteriorCondition: '',
    interiorCondition: '',
    notes: '',
    markComplete: true,
  })
  const [inspectionItems, setInspectionItems] = useState([{ ...EMPTY_INSPECTION_ITEM }])

  const [tasks, setTasks] = useState([])
  const [taskOpen, setTaskOpen] = useState(false)
  const [taskForm, setTaskForm] = useState({ ...EMPTY_TASK })

  const [parts, setParts] = useState([])
  const [partOpen, setPartOpen] = useState(false)
  const [partForm, setPartForm] = useState({ inventoryPartId: '', quantity: 1 })
  const [inventoryParts, setInventoryParts] = useState([])

  const load = async () => {
    try {
      const res = await getJob(jobId)
      setJob(res.data)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const loadEstimate = async () => {
    try {
      const res = await getEstimate(jobId)
      setEstimate(res.data)
    } catch {
      setEstimate(null)
    }
  }

  const loadMedia = async () => {
    try {
      const res = await listJobMedia(jobId)
      setMedia(res.data || [])
    } catch {
      setMedia([])
    }
  }

  const loadInspections = async () => {
    try {
      const res = await listInspections({ jobId, limit: 50 })
      setInspections(res.data?.inspections || [])
    } catch {
      setInspections([])
    }
  }

  const loadTasks = async () => {
    try {
      const res = await listJobTasks(jobId, { limit: 100 })
      setTasks(res.data?.tasks || [])
    } catch {
      setTasks([])
    }
  }

  const loadParts = async () => {
    try {
      const res = await listJobParts(jobId, { limit: 100 })
      setParts(res.data?.parts || [])
    } catch {
      setParts([])
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
    if (!job?._id) return
    let cancelled = false
    getEstimate(jobId)
      .then((res) => { if (!cancelled) setEstimate(res.data) })
      .catch(() => { if (!cancelled) setEstimate(null) })
    listJobMedia(jobId)
      .then((res) => { if (!cancelled) setMedia(res.data || []) })
      .catch(() => { if (!cancelled) setMedia([]) })
    listInspections({ jobId, limit: 50 })
      .then((res) => { if (!cancelled) setInspections(res.data?.inspections || []) })
      .catch(() => { if (!cancelled) setInspections([]) })
    listJobTasks(jobId, { limit: 100 })
      .then((res) => { if (!cancelled) setTasks(res.data?.tasks || []) })
      .catch(() => { if (!cancelled) setTasks([]) })
    listJobParts(jobId, { limit: 100 })
      .then((res) => { if (!cancelled) setParts(res.data?.parts || []) })
      .catch(() => { if (!cancelled) setParts([]) })
    return () => { cancelled = true }
  }, [job?._id, jobId])

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
            onClick={() => navigate(getJobBackPath(role))}
            className="mt-4 px-6 py-3 text-xs font-black uppercase tracking-widest"
            style={primaryButtonStyle}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const pipelineIndex = PIPELINE.indexOf(job.status)
  const currentIndex = pipelineIndex === -1 ? -1 : pipelineIndex
  const nextStatuses = getJobActionsForRole(role, job.status)

  const isStaffRole = STAFF_ROLES.includes(role)
  const canUploadPhotos = PHOTO_ROLES.includes(role)
  const isCustomerOwner = role === 'CUSTOMER'
  const canRespondEstimate = isCustomerOwner && job.status === 'CUSTOMER_APPROVAL' && estimate?.status === 'PENDING_APPROVAL'
  const canCreateEstimate = (role === 'SERVICE_ADVISOR' || role === 'WORKSHOP_MANAGER' || role === 'ADMIN') &&
    ['INSPECTION', 'ESTIMATE_PENDING', 'CUSTOMER_APPROVAL'].includes(job.status)

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

  const updateEstimateItem = (index, key) => (e) => {
    setEstimateItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: e.target.value } : item)),
    )
  }

  const addEstimateItem = () => {
    setEstimateItems((items) => [...items, { ...EMPTY_ESTIMATE_ITEM }])
  }

  const removeEstimateItem = (index) => {
    setEstimateItems((items) => items.filter((_, i) => i !== index))
  }

  const handleCreateEstimate = async (e) => {
    e.preventDefault()
    const validItems = estimateItems.filter((item) => item.name?.trim() && Number(item.unitPrice) >= 0)
    if (validItems.length === 0) {
      toast.error('Add at least one estimate item')
      return
    }
    setUpdating(true)
    try {
      const items = validItems.map((item) => ({
        type: item.type,
        name: item.name.trim(),
        description: item.description?.trim() || undefined,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      }))
      await createEstimate(job._id, {
        items,
        discount: estimateDiscount !== '' ? Number(estimateDiscount) : 0,
        tax: estimateTax !== '' ? Number(estimateTax) : 0,
        notes: estimateNotes || undefined,
      })
      toast.success('Estimate sent for customer approval')
      setEstimateOpen(false)
      setEstimateItems([{ ...EMPTY_ESTIMATE_ITEM }])
      setEstimateDiscount('')
      setEstimateTax('')
      setEstimateNotes('')
      load()
      loadEstimate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleRespond = async (action, cancelBooking = false) => {
    setUpdating(true)
    try {
      await respondToEstimate(job._id, {
        action,
        remarks: respondRemarks || undefined,
        ...(cancelBooking ? { cancelBooking: true } : {}),
      })
      toast.success(cancelBooking
        ? 'Booking cancelled — this job is closed'
        : action === 'APPROVED' ? 'Estimate approved — work can begin' : 'Estimate rejected')
      setRespondOpen(false)
      setRespondRemarks('')
      load()
      loadEstimate()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      await uploadJobMedia(job._id, file, uploadCategory)
      toast.success(`${uploadCategory} photo uploaded`)
      loadMedia()
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
      loadMedia()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const updateInspectionItem = (index, key) => (e) => {
    setInspectionItems((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: e.target.value } : item)),
    )
  }

  const addInspectionItem = () => {
    setInspectionItems((items) => [...items, { ...EMPTY_INSPECTION_ITEM }])
  }

  const removeInspectionItem = (index) => {
    setInspectionItems((items) => items.filter((_, i) => i !== index))
  }

  const handleCreateInspection = async (e) => {
    e.preventDefault()
    const items = inspectionItems
      .filter((item) => item.component?.trim())
      .map((item) => ({
        component: item.component.trim(),
        condition: item.condition,
        notes: item.notes?.trim() || undefined,
        recommendedAction: item.recommendedAction?.trim() || undefined,
      }))

    setUpdating(true)
    try {
      const res = await createInspection({
        jobId: job._id,
        inspectionType: inspectionForm.inspectionType,
        odometerReading: inspectionForm.odometerReading !== '' ? Number(inspectionForm.odometerReading) : undefined,
        fuelLevel: inspectionForm.fuelLevel !== '' ? Number(inspectionForm.fuelLevel) : undefined,
        exteriorCondition: inspectionForm.exteriorCondition.trim() || undefined,
        interiorCondition: inspectionForm.interiorCondition.trim() || undefined,
        notes: inspectionForm.notes.trim() || undefined,
        items,
      })
      if (inspectionForm.markComplete) {
        await completeInspection(res.data._id)
        toast.success('Inspection completed')
      } else {
        toast.success('Inspection draft saved')
      }
      setInspectionOpen(false)
      setInspectionForm({ inspectionType: 'INITIAL', odometerReading: '', fuelLevel: '', exteriorCondition: '', interiorCondition: '', notes: '', markComplete: true })
      setInspectionItems([{ ...EMPTY_INSPECTION_ITEM }])
      loadInspections()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleCompleteInspection = async (inspection) => {
    try {
      await completeInspection(inspection._id)
      toast.success('Inspection marked complete')
      loadInspections()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) {
      toast.error('Task title is required')
      return
    }
    setUpdating(true)
    try {
      await createJobTask(job._id, {
        title: taskForm.title.trim(),
        description: taskForm.description?.trim() || undefined,
        taskType: taskForm.taskType,
        assignedMechanicId: taskForm.assignedMechanicId || undefined,
        estimatedMinutes: taskForm.estimatedMinutes !== '' ? Number(taskForm.estimatedMinutes) : undefined,
      })
      toast.success('Task added to the job card')
      setTaskOpen(false)
      setTaskForm({ ...EMPTY_TASK })
      loadTasks()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleTaskStatus = async (task, status) => {
    try {
      await updateJobTaskStatus(job._id, task._id, { status })
      toast.success(`Task marked ${status.replace(/_/g, ' ').toLowerCase()}`)
      loadTasks()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDeleteTask = async (task) => {
    try {
      await deleteJobTask(job._id, task._id)
      toast.success('Task removed')
      loadTasks()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openPartModal = async () => {
    setPartForm({ inventoryPartId: '', quantity: 1 })
    setPartOpen(true)
    if (inventoryParts.length === 0 && job.workshopId?._id) {
      try {
        const res = await listInventoryParts({
          workshopId: job.workshopId._id,
          status: 'ACTIVE',
          limit: 100,
        })
        const list = res.data?.parts || res.data?.inventoryParts || res.data || []
        setInventoryParts(Array.isArray(list) ? list : [])
      } catch {
        setInventoryParts([])
      }
    }
  }

  const handleAddPart = async (e) => {
    e.preventDefault()
    if (!partForm.inventoryPartId) {
      toast.error('Select an inventory part')
      return
    }
    setUpdating(true)
    try {
      await createJobPart(job._id, {
        inventoryPartId: partForm.inventoryPartId,
        quantity: Number(partForm.quantity) || 1,
      })
      toast.success('Part reserved for this job')
      setPartOpen(false)
      loadParts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handlePartStatus = async (part, status) => {
    try {
      await updateJobPartStatus(job._id, part._id, { status })
      toast.success(`Part marked ${status.toLowerCase()}`)
      loadParts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const defaultAction = nextStatuses?.[0]
  const subtotal = (estimate?.items || []).reduce((s, i) => s + ((i.quantity || 1) * (i.unitPrice || 0)), 0)
  const total = estimate?.pricing?.total ??
    (subtotal - (estimate?.pricing?.discount || 0) + (estimate?.pricing?.tax || 0))

  const beforePhotos = media.filter((m) => m.category === 'BEFORE')
  const afterPhotos = media.filter((m) => m.category === 'AFTER')
  const otherPhotos = media.filter((m) => m.category !== 'BEFORE' && m.category !== 'AFTER')

  const renderPhotoSection = (title, items, categoryKey) => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-black uppercase tracking-widest"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
        >
          {title}
        </h3>
        {canUploadPhotos && (
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
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: MUTED }}>
          No {categoryKey.toLowerCase()} photos yet.
          {canUploadPhotos && ` Upload photos to show the car's state before work begins.`}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m) => {
            const canDelete =
              m.uploadedBy === user?._id || isStaffRole
            return (
              <div
                key={m._id}
                className="relative group"
                style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
              >
                <img src={m.url} alt={m.category} className="w-full h-28 sm:h-32 object-cover" />
                <div className="px-2 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>
                    {formatDateTime(m.createdAt)}
                  </span>
                  {canDelete && (
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
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate(getJobBackPath(role))}
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
            <InfoRow icon={ClipboardList} label="Workshop" value={job.workshopId?.name} />
            <InfoRow icon={User} label="Service Advisor" value={job.serviceAdvisorId?.name} />
            <InfoRow icon={User} label="Workshop Manager" value={job.workshopManagerId?.name} />
            <InfoRow icon={User} label="Assigned Mechanic" value={job.assignedMechanicId ? (job.assignedMechanicId.userId?.name ? `${job.assignedMechanicId.employeeCode} (${job.assignedMechanicId.userId.name})` : (job.assignedMechanicId.employeeCode || 'Mechanic')) : 'Unassigned'} />
            <InfoRow icon={Gauge} label="Odometer In" value={job.odometerIn ? `${job.odometerIn.toLocaleString()} km` : null} />
            <InfoRow icon={Gauge} label="Odometer Out" value={job.odometerOut ? `${job.odometerOut.toLocaleString()} km` : null} />
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

        {/* Estimate */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Estimate
              </h2>
              {estimate && <StatusBadge status={estimate.status} />}
            </div>
            <div className="flex items-center gap-3">
              {canRespondEstimate && (
                <button
                  type="button"
                  onClick={() => setRespondOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                >
                  <ThumbsUp size={13} />
                  Approve / Reject
                </button>
              )}
              {canCreateEstimate && (
                <button
                  type="button"
                  onClick={() => setEstimateOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                  style={ghostButtonStyle}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                >
                  {estimate ? <Loader2 size={13} /> : <FileText size={13} />}
                  {estimate ? 'Revise Estimate' : 'Create Estimate'}
                </button>
              )}
            </div>
          </div>

          {!estimate ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No estimate yet.{' '}
              {canCreateEstimate
                ? 'Create an estimate to share the breakdown with the customer for approval.'
                : 'The service advisor will share an estimate once the inspection is complete.'}
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
                {(estimate.pricing?.discount > 0 || estimateDiscount) && (
                  <div className="flex items-center gap-6" style={{ color: '#10b981' }}>
                    <span>Discount</span>
                    <span>- ₹{estimate.pricing?.discount?.toLocaleString('en-IN') || 0}</span>
                  </div>
                )}
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Tax</span>
                  <span style={{ color: FOREGROUND }}>₹{estimate.pricing?.tax?.toLocaleString('en-IN') || 0}</span>
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
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <ClipboardCheck size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Inspections ({inspections.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setInspectionOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              <Plus size={13} />
              New Inspection
            </button>
          </div>

          {inspections.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No inspections recorded. Log the vehicle condition before work starts — it feeds the
              estimate and protects the shop if the customer disputes the bill.
            </p>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <div
                  key={inspection._id}
                  style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE, padding: '1rem' }}
                >
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
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ color: MUTED }}>
                        {inspection.inspectorId?.name || 'Inspector'} · {formatDateTime(inspection.completedAt || inspection.createdAt)}
                      </span>
                      {inspection.status !== 'COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => handleCompleteInspection(inspection)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          Complete
                        </button>
                      )}
                    </div>
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
                      <table className="w-full text-left min-w-[520px]">
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
        </section>

        {/* Job tasks */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <ListChecks size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Job Tasks ({tasks.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setTaskOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              <Plus size={13} />
              Add Task
            </button>
          </div>

          {tasks.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No tasks yet. Break the job down into tasks so mechanics can track progress.
            </p>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3"
                  style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>{task.title}</p>
                    {task.description && (
                      <p className="text-xs mt-0.5" style={{ color: MUTED }}>{task.description}</p>
                    )}
                    <p className="text-[11px] mt-1 uppercase tracking-widest" style={{ color: MUTED }}>
                      {task.taskType}
                      {task.assignedMechanicId?.userId?.name ? ` · ${task.assignedMechanicId.userId.name}` : ''}
                      {task.estimatedMinutes ? ` · ~${task.estimatedMinutes} min` : ''}
                      {task.blockedReason ? ` · ${task.blockedReason}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <StatusBadge status={task.status} />
                    {TASK_STATUSES.filter((status) => status !== task.status).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleTaskStatus(task, status)}
                        className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                        style={ghostButtonStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task)}
                      className="p-1.5 cursor-pointer transition-colors"
                      style={{ color: MUTED, background: 'transparent', border: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
                      aria-label="Delete task"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Job parts */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <Package size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Parts Used ({parts.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={openPartModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              <Plus size={13} />
              Reserve Part
            </button>
          </div>

          {parts.length === 0 ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No parts reserved for this job. Reserve a part to deduct it from workshop inventory.
            </p>
          ) : (
            <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
              <table className="w-full text-left min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                    {['Part', 'Qty', 'Unit Price', 'Total', 'Status', 'Action'].map((h) => (
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
                  {parts.map((part) => (
                    <tr key={part._id} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                        {part.inventoryPartId?.name || 'Part'}
                        <p className="text-xs" style={{ color: MUTED }}>
                          {part.inventoryPartId?.partNumber || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{part.quantity}</td>
                      <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>
                        ₹{(part.unitPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                        ₹{(part.totalPrice || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={part.status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {PART_STATUSES.filter((status) => status !== part.status).map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handlePartStatus(part, status)}
                              className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                              style={ghostButtonStyle}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
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
            {canUploadPhotos && (
              <SelectInput
                label=""
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="BEFORE" style={{ background: PANEL }}>Before Work</option>
                <option value="AFTER" style={{ background: PANEL }}>After Work</option>
                <option value="DAMAGE" style={{ background: PANEL }}>Damage</option>
                <option value="INSPECTION" style={{ background: PANEL }}>Inspection</option>
              </SelectInput>
            )}
          </div>
          <div className="space-y-6">
            {renderPhotoSection(`Before Work (${beforePhotos.length})`, beforePhotos, 'before')}
            {renderPhotoSection(`After Work (${afterPhotos.length})`, afterPhotos, 'after')}
            {otherPhotos.length > 0 && renderPhotoSection(`Other (${otherPhotos.length})`, otherPhotos, 'other')}
          </div>
        </section>
      </div>

      {/* Inspection modal */}
      <Modal open={inspectionOpen} onClose={() => setInspectionOpen(false)} title="New Inspection" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateInspection} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label="Inspection Type"
              value={inspectionForm.inspectionType}
              onChange={(e) => setInspectionForm((s) => ({ ...s, inspectionType: e.target.value }))}
            >
              {INSPECTION_TYPES.map((type) => (
                <option key={type} value={type} style={{ background: PANEL }}>{type}</option>
              ))}
            </SelectInput>
            <TextInput
              label="Odometer Reading (km)"
              type="number"
              min={0}
              value={inspectionForm.odometerReading}
              onChange={(e) => setInspectionForm((s) => ({ ...s, odometerReading: e.target.value }))}
              placeholder="24500"
            />
            <TextInput
              label="Fuel Level (%)"
              type="number"
              min={0}
              max={100}
              value={inspectionForm.fuelLevel}
              onChange={(e) => setInspectionForm((s) => ({ ...s, fuelLevel: e.target.value }))}
              placeholder="50"
            />
            <TextInput
              label="Exterior Condition"
              value={inspectionForm.exteriorCondition}
              onChange={(e) => setInspectionForm((s) => ({ ...s, exteriorCondition: e.target.value }))}
              placeholder="Scratches on bumper"
            />
            <TextInput
              label="Interior Condition"
              value={inspectionForm.interiorCondition}
              onChange={(e) => setInspectionForm((s) => ({ ...s, interiorCondition: e.target.value }))}
              placeholder="Good, seats cleaned"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: '#8a8580', letterSpacing: '0.14em' }}
              >
                Checklist
              </p>
              <button
                type="button"
                onClick={addInspectionItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest cursor-pointer"
                style={ghostButtonStyle}
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>

            <div className="space-y-2 max-h-[28vh] overflow-y-auto pr-1">
              {inspectionItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end p-3"
                  style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
                >
                  <div className="col-span-4">
                    <TextInput
                      label="Component"
                      required
                      value={item.component}
                      onChange={updateInspectionItem(index, 'component')}
                      placeholder="Front bumper"
                    />
                  </div>
                  <div className="col-span-3">
                    <SelectInput
                      label="Condition"
                      value={item.condition}
                      onChange={updateInspectionItem(index, 'condition')}
                    >
                      {ITEM_CONDITIONS.map((condition) => (
                        <option key={condition} value={condition} style={{ background: PANEL }}>
                          {condition.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </SelectInput>
                  </div>
                  <div className="col-span-4">
                    <TextInput
                      label="Recommended Action"
                      value={item.recommendedAction}
                      onChange={updateInspectionItem(index, 'recommendedAction')}
                      placeholder="Replace"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeInspectionItem(index)}
                      disabled={inspectionItems.length === 1}
                      className="p-2 cursor-pointer disabled:opacity-30"
                      style={{ color: MUTED, background: 'transparent', border: 'none' }}
                      aria-label="Remove checklist item"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TextArea
            label="Overall Notes"
            rows={2}
            value={inspectionForm.notes}
            onChange={(e) => setInspectionForm((s) => ({ ...s, notes: e.target.value }))}
            placeholder="Anything the customer should be aware of"
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: MUTED }}>
            <input
              type="checkbox"
              checked={inspectionForm.markComplete}
              onChange={(e) => setInspectionForm((s) => ({ ...s, markComplete: e.target.checked }))}
            />
            Mark this inspection as completed immediately
          </label>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setInspectionOpen(false)}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              {updating ? 'Saving...' : inspectionForm.markComplete ? 'Save & Complete' : 'Save Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task modal */}
      <Modal open={taskOpen} onClose={() => setTaskOpen(false)} title="Add Job Task">
        <form onSubmit={handleCreateTask} className="space-y-4" noValidate>
          <TextInput
            label="Task Title"
            required
            value={taskForm.title}
            onChange={(e) => setTaskForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Door repaint"
          />
          <TextArea
            label="Description"
            rows={2}
            value={taskForm.description}
            onChange={(e) => setTaskForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="What needs to be done"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SelectInput
              label="Task Type"
              value={taskForm.taskType}
              onChange={(e) => setTaskForm((s) => ({ ...s, taskType: e.target.value }))}
            >
              {TASK_TYPES.map((type) => (
                <option key={type} value={type} style={{ background: PANEL }}>{type}</option>
              ))}
            </SelectInput>
            <SelectInput
              label="Assign Mechanic"
              placeholder="Unassigned"
              value={taskForm.assignedMechanicId}
              onChange={(e) => setTaskForm((s) => ({ ...s, assignedMechanicId: e.target.value }))}
            >
              {mechanics.map((m) => (
                <option key={m._id} value={m._id} style={{ background: PANEL }}>
                  {m.userId?.name || m.employeeCode}
                </option>
              ))}
            </SelectInput>
            <TextInput
              label="Estimated Minutes"
              type="number"
              min={0}
              value={taskForm.estimatedMinutes}
              onChange={(e) => setTaskForm((s) => ({ ...s, estimatedMinutes: e.target.value }))}
              placeholder="90"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setTaskOpen(false)}
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
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              {updating ? 'Adding...' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Part modal */}
      <Modal open={partOpen} onClose={() => setPartOpen(false)} title="Reserve Part">
        <form onSubmit={handleAddPart} className="space-y-4" noValidate>
          <SelectInput
            label="Inventory Part"
            required
            placeholder={inventoryParts.length ? 'Select a part' : 'No active parts in inventory'}
            value={partForm.inventoryPartId}
            onChange={(e) => setPartForm((s) => ({ ...s, inventoryPartId: e.target.value }))}
          >
            {inventoryParts.map((part) => (
              <option key={part._id} value={part._id} style={{ background: PANEL }}>
                {part.name} — {part.partNumber} ({part.stock?.quantity ?? 0} {part.unit || 'in stock'})
              </option>
            ))}
          </SelectInput>

          {inventoryParts.length === 0 && (
            <TextInput
              label="Inventory Part ID (manual)"
              value={partForm.inventoryPartId}
              onChange={(e) => setPartForm((s) => ({ ...s, inventoryPartId: e.target.value }))}
              placeholder="Paste inventory part _id"
            />
          )}

          <TextInput
            label="Quantity"
            type="number"
            min={1}
            value={partForm.quantity}
            onChange={(e) => setPartForm((s) => ({ ...s, quantity: e.target.value }))}
          />

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setPartOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !partForm.inventoryPartId}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              {updating ? 'Reserving...' : 'Reserve Part'}
            </button>
          </div>
        </form>
      </Modal>

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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !assignForm.mechanicId}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
            >
              {updating ? 'Assigning...' : 'Assign Mechanic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Estimate modal */}
      <Modal open={estimateOpen} onClose={() => setEstimateOpen(false)} title="Create / Revise Estimate" maxWidth="max-w-2xl">
        <form onSubmit={handleCreateEstimate} className="space-y-4" noValidate>
          <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
            {estimateItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end p-3" style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}>
                <div className="col-span-2">
                  <SelectInput label="Type" value={item.type} onChange={updateEstimateItem(index, 'type')}>
                    <option value="LABOUR" style={{ background: PANEL }}>LABOUR</option>
                    <option value="PART" style={{ background: PANEL }}>PART</option>
                    <option value="SERVICE" style={{ background: PANEL }}>SERVICE</option>
                    <option value="OTHER" style={{ background: PANEL }}>OTHER</option>
                  </SelectInput>
                </div>
                <div className="col-span-4">
                  <TextInput label="Item Name" required value={item.name} onChange={updateEstimateItem(index, 'name')} placeholder="Polishing / part name" />
                </div>
                <div className="col-span-3">
                  <TextInput label="Qty" type="number" min={1} value={item.quantity} onChange={updateEstimateItem(index, 'quantity')} />
                </div>
                <div className="col-span-2">
                  <TextInput label="Unit Price ₹" type="number" min={0} value={item.unitPrice} onChange={updateEstimateItem(index, 'unitPrice')} placeholder="1500" />
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeEstimateItem(index)}
                    disabled={estimateItems.length === 1}
                    className="p-2 cursor-pointer disabled:opacity-30"
                    style={{ color: MUTED, background: 'transparent', border: 'none' }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={addEstimateItem}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-[11px] font-black uppercase tracking-widest cursor-pointer"
              style={ghostButtonStyle}
            >
              + Add Item
            </button>
            <div className="flex gap-3">
              <TextInput
                label="Discount ₹"
                type="number"
                min={0}
                value={estimateDiscount}
                onChange={(e) => setEstimateDiscount(e.target.value)}
                placeholder="0"
                style={{ width: '120px' }}
              />
              <TextInput
                label="Tax ₹"
                type="number"
                min={0}
                value={estimateTax}
                onChange={(e) => setEstimateTax(e.target.value)}
                placeholder="0"
                style={{ width: '120px' }}
              />
            </div>
          </div>

          <TextArea
            label="Notes (internal)"
            rows={2}
            value={estimateNotes}
            onChange={(e) => setEstimateNotes(e.target.value)}
            placeholder="Basis of estimate, assumptions…"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEstimateOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
            >
              {updating ? 'Saving...' : 'Send for Approval'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Estimate respond modal */}
      <Modal open={respondOpen} onClose={() => setRespondOpen(false)} title="Respond to Estimate">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: MUTED }}>
            Approving authorises the workshop to begin work. Rejecting returns the job to the
            service advisor to revise the estimate — or you can reject and cancel the booking entirely.
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
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleRespond('REJECTED', true)}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-50"
              style={{
                ...ghostButtonStyle,
                color: '#f87171',
                borderColor: '#7f2a24',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f87171' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#7f2a24' }}
            >
              <Trash2 size={13} />
              Reject &amp; Cancel Booking
            </button>
            <button
              type="button"
              disabled={updating}
              onClick={() => handleRespond('REJECTED')}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
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