import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList, Plus, Wrench, Boxes, Users, CalendarClock, TrendingUp } from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
} from '../../components/Field'
import { useAuth } from '../../contexts/authContext'
import { listJobs, listWorkshopJobs, createJob } from '../../services/jobApi'
import { listWorkshopBookings } from '../../services/bookingApi'
import { listWorkshops, getWorkshopOverview } from '../../services/masterApi'
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

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-center gap-3 p-4" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
      <div className="flex items-center justify-center w-10 h-10 shrink-0" style={{ background: accent ? `${accent}1f` : 'rgba(217,79,61,0.10)' }}>
        <Icon size={18} style={{ color: accent || ACCENT }} />
      </div>
      <div>
        <p className="text-2xl font-black leading-none" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          {value}
        </p>
        <p className="text-[11px] uppercase tracking-widest mt-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {label}
        </p>
      </div>
    </div>
  )
}

export default function JobBoardPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const role = user?.role
  const isMechanic = role === 'MECHANIC'
  const isManager = role === 'WORKSHOP_MANAGER' || role === 'ADMIN'

  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [jobs, setJobs] = useState([])
  const [overview, setOverview] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [jobModal, setJobModal] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [creating, setCreating] = useState(false)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    listWorkshops({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const list = res.data?.workshops || res.data || []
        setWorkshops(Array.isArray(list) ? list : [])
        if (!Array.isArray(list) || list.length === 0) return
        const preferred =
          (typeof user?.workshopId === 'object' && user.workshopId?._id) ||
          (typeof user?.workshopId === 'string' && user.workshopId) ||
          ''
        const matched = preferred && list.some((w) => w._id === preferred)
        setWorkshopId((prev) => prev || (matched ? preferred : list[0]._id))
      })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
    return () => { cancelled = true }
  }, [user?.workshopId])

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    const fetchJobs = isMechanic
      ? listJobs({ limit: 100 })
      : listWorkshopJobs(workshopId, { limit: 100 })
    fetchJobs
      .then((res) => { if (!cancelled) setJobs(res.data?.jobs || []) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workshopId, isMechanic])

  useEffect(() => {
    if (!workshopId || !isManager) return
    let cancelled = false
    getWorkshopOverview(workshopId)
      .then((res) => { if (!cancelled) setOverview(res.data) })
      .catch(() => { if (!cancelled) setOverview(null) })
    return () => { cancelled = true }
  }, [workshopId, isManager])

  const visibleJobs = filter === 'ALL' ? jobs : jobs.filter((j) => j.status === filter)

  const reloadJobs = async () => {
    try {
      const res = isMechanic
        ? await listJobs({ limit: 100 })
        : await listWorkshopJobs(workshopId, { limit: 100 })
      setJobs(res.data?.jobs || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openCreateJob = async () => {
    if (!workshopId) {
      toast.error('Select a workshop first')
      return
    }
    setBookings([])
    setBookingId('')
    setBookingsLoading(true)
    setJobModal(true)
    try {
      const res = await listWorkshopBookings(workshopId, { limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      const allBookings = res.data?.bookings || []
      const jobBookingIds = new Set(
        (jobs || [])
          .map((j) => {
            if (j.bookingId && typeof j.bookingId === 'object') return j.bookingId._id?.toString()
            if (j.bookingId) return j.bookingId.toString()
            return null
          })
          .filter(Boolean),
      )
      const eligible = allBookings.filter(
        (b) =>
          !jobBookingIds.has(b._id?.toString()) &&
          !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(b.status),
      )
      setBookings(eligible)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBookingsLoading(false)
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
                {isMechanic ? 'My Jobs' : 'Job Board'}
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {isMechanic
                ? 'Jobs assigned to you — repair the car and keep the status updated'
                : isManager
                  ? 'Manage every job in the workshop service pipeline and inspect the work'
                  : 'Track every job in the workshop service pipeline'}
            </p>
          </div>
          {!isMechanic && (
            <button
              type="button"
              onClick={openCreateJob}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Plus size={16} />
              Create Job
            </button>
          )}
        </div>

        {isManager && overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
            <StatCard icon={Wrench} label="Active Jobs" value={overview.totalActiveJobs || 0} />
            <StatCard icon={TrendingUp} label="In Progress" value={overview.jobsByStatus?.IN_PROGRESS || 0} accent="#38bdf8" />
            <StatCard icon={ClipboardList} label="Awaiting QC" value={overview.jobsByStatus?.QUALITY_CHECK || 0} accent="#a78bfa" />
            <StatCard icon={CalendarClock} label="Bookings Today" value={overview.bookingsToday || 0} accent="#10b981" />
            <StatCard icon={Users} label="Mechanics" value={overview.activeMechanics || 0} accent="#fbbf24" />
            <StatCard icon={Boxes} label="Low Stock" value={overview.lowStockCount || 0} accent={overview.lowStockCount ? ACCENT : '#10b981'} />
          </div>
        )}

        {!isMechanic && workshopId === '' && (
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
        )}

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
            title={isMechanic ? 'No assigned jobs' : 'Select a workshop'}
            message={isMechanic
              ? 'Jobs assigned to you will appear here once a service advisor or manager allocates them.'
              : 'Choose a workshop from the dropdown to load its jobs.'}
          />
        ) : loading ? (
          <Spinner />
        ) : visibleJobs.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No jobs found"
            message={isMechanic ? 'You have no jobs in this status yet.' : 'Create a job from a booking to start the workflow.'}
            action={!isMechanic ? (
              <button
                type="button"
                onClick={openCreateJob}
                className="inline-flex items-center gap-1.5 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
              >
                <Plus size={14} />
                Create Job
              </button>
            ) : undefined}
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
                        ? job.assignedMechanicId.userId
                          ? job.assignedMechanicId.userId?.name
                          : (job.assignedMechanicId.employeeCode || 'Mechanic')
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
          <SelectInput
            label="Booking"
            required
            placeholder={bookingsLoading ? 'Loading bookings…' : 'Select a booking to convert'}
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
          >
            {bookingsLoading ? (
              <option disabled style={{ background: PANEL }}>Loading bookings…</option>
            ) : bookings.length === 0 ? (
              <option disabled style={{ background: PANEL }}>No bookings available to convert</option>
            ) : (
              bookings.map((b) => (
                <option key={b._id} value={b._id} style={{ background: PANEL }}>
                  {b.bookingNumber} · {b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Vehicle'} · {formatDate(b.appointment?.date)}
                </option>
              ))
            )}
          </SelectInput>
          <p className="text-xs" style={{ color: MUTED }}>
            A job is created for the selected booking so the workshop can run it through the service
            pipeline (check-in → inspection → estimate → work → delivery).
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setJobModal(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !bookingId}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={primaryButtonStyle}
            >
              {creating ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}