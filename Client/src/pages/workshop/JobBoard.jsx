import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList, Plus, Wrench } from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
  TextInput,
} from '../../components/Field'
import { listWorkshopJobs, createJob } from '../../services/jobApi'
import { listWorkshops } from '../../services/masterApi'
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

const JOB_FILTERS = [
  'ALL',
  'CREATED',
  'CHECK_IN',
  'INSPECTION',
  'ESTIMATE_PENDING',
  'CUSTOMER_APPROVAL',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'REWORK',
  'READY',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]

export default function JobBoardPage() {
  const navigate = useNavigate()
  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [jobModal, setJobModal] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let cancelled = false
    listWorkshops({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const list = res.data?.workshops || res.data || []
        setWorkshops(Array.isArray(list) ? list : [])
        if (Array.isArray(list) && list.length > 0) setWorkshopId((prev) => prev || list[0]._id)
      })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    listWorkshopJobs(workshopId, { limit: 100 })
      .then((res) => { if (!cancelled) setJobs(res.data?.jobs || []) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workshopId])

  const visibleJobs = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)

  const reloadJobs = async () => {
    if (!workshopId) return
    try {
      const res = await listWorkshopJobs(workshopId, { limit: 100 })
      setJobs(res.data?.jobs || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleCreateJob = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await createJob({ bookingId })
      toast.success(res.message || 'Job created')
      setJobModal(false)
      setBookingId('')
      reloadJobs()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Job Board
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Track every job in the workshop service pipeline
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setJobModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Plus size={16} />
              Create Job
            </button>
          </div>
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
          {JOB_FILTERS.map((f) => (
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
          <EmptyState
            icon={Wrench}
            title="Select a workshop"
            message="Choose a workshop from the dropdown to load its jobs."
          />
        ) : loading ? (
          <Spinner />
        ) : visibleJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No jobs found"
            message="Create a job from a booking to start the workflow."
            action={
              <button
                type="button"
                onClick={() => setJobModal(true)}
                className="inline-flex items-center gap-1.5 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                <Plus size={14} />
                Create Job
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Job', 'Vehicle', 'Booking', 'Mechanic', 'Expected', 'Status'].map((h) => (
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
                {visibleJobs.map((job) => (
                  <tr
                    key={job._id}
                    onClick={() => navigate(`/workshop/jobs/${job._id}`)}
                    className="transition-colors duration-150 cursor-pointer"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                        <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {job.jobNumber}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: MUTED }}>
                          {formatDateTime(job.createdAt)}
                        </p>
                      </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {job.vehicleId ? `${job.vehicleId.make} ${job.vehicleId.model}` : '—'}
                      <p className="text-xs" style={{ color: MUTED }}>
                        {job.vehicleId?.registrationNumber || ''}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {job.bookingId?.bookingNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {job.assignedMechanicId
                        ? `${job.assignedMechanicId.userId?.name || 'Mechanic'}`
                        : 'Unassigned'}
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDate(job.expectedCompletionAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={jobModal} onClose={() => setJobModal(false)} title="Create Job from Booking">
        <form onSubmit={handleCreateJob} className="space-y-4" noValidate>
          <TextInput
            label="Booking ID"
            required
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            placeholder="Paste the booking _id"
          />
          <p className="text-xs" style={{ color: MUTED }}>
            A job is created for the booking so the workshop can run it through the service
            pipeline (check-in → inspection → estimate → work → delivery).
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setJobModal(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !bookingId}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              {creating ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}