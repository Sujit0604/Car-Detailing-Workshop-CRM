import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList, Wrench, Plus, Eye } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput } from '../../components/Field'
import { listAllJobs, listAllBookings } from '../../services/adminApi'
import { updateJobStatus, assignMechanic, createJob } from '../../services/jobApi'
import { listMechanics } from '../../services/mechanicApi'
import { JOB_NEXT_STATUS, formatDate } from '../../utils/transitions'
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

const TERMINAL_JOB_STATUSES = ['COMPLETED', 'CANCELLED']

export default function Jobs() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)

  const [statusTarget, setStatusTarget] = useState(null)
  const [statusValue, setStatusValue] = useState('')
  const [updating, setUpdating] = useState(false)

  const [assignTarget, setAssignTarget] = useState(null)
  const [assignValue, setAssignValue] = useState('')
  const [mechanics, setMechanics] = useState([])
  const [mechanicsLoading, setMechanicsLoading] = useState(false)

  const [jobModal, setJobModal] = useState(false)
  const [bookingId, setBookingId] = useState('')
  const [creating, setCreating] = useState(false)
  const [bookings, setBookings] = useState([])
  const [bookingsLoading, setBookingsLoading] = useState(false)

  const buildParams = () => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (filter !== 'ALL') params.status = filter
    return params
  }

  const reload = async () => {
    try {
      const res = await listAllJobs(buildParams())
      setJobs(res.data?.jobs || [])
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (filter !== 'ALL') params.status = filter
    let cancelled = false
    listAllJobs(params)
      .then((res) => {
        if (!cancelled) {
          setJobs(res.data?.jobs || [])
          setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
        }
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
  }, [page, filter])

  const openStatus = (job) => {
    setStatusTarget(job)
    setStatusValue('')
  }

  const handleStatus = async () => {
    setUpdating(true)
    try {
      await updateJobStatus(statusTarget._id, { status: statusValue })
      toast.success(`Job moved to ${statusValue.replace(/_/g, ' ')}`)
      setStatusTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const openAssign = async (job) => {
    setAssignTarget(job)
    setAssignValue(job.assignedMechanicId?._id || '')
    setMechanics([])
    setMechanicsLoading(true)
    try {
      const workshopId = job.workshopId?._id || job.workshopId
      if (!workshopId) throw new Error('This job has no workshop')
      const res = await listMechanics({ workshopId, limit: 100 })
      const list = res.data?.mechanics || []
      setMechanics(Array.isArray(list) ? list : [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setMechanicsLoading(false)
    }
  }

  const handleAssign = async () => {
    setUpdating(true)
    try {
      await assignMechanic(assignTarget._id, { mechanicId: assignValue })
      toast.success('Mechanic assigned')
      setAssignTarget(null)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const openCreateJob = async () => {
    setBookings([])
    setBookingId('')
    setJobModal(true)
    setBookingsLoading(true)
    try {
      const bookingsRes = await listAllBookings({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      const allBookings = bookingsRes.data?.bookings || []
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
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardList size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Jobs
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} jobs across all workshops
            </p>
          </div>
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
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {JOB_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setFilter(f); setPage(1); setLoading(true) }}
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

        {loading ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <EmptyState title="No jobs found" message="Jobs will appear here once bookings are converted." />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Job', 'Booking', 'Customer', 'Vehicle', 'Workshop', 'Assignee', 'Created', 'Status', 'Actions'].map((h) => (
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
                {jobs.map((j) => (
                  <tr
                    key={j._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {j.jobNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {j.bookingId?.bookingNumber || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {j.customerId?.name || '—'}
                      <p className="text-xs" style={{ color: MUTED }}>{j.customerId?.phone || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {j.vehicleId ? `${j.vehicleId.make} ${j.vehicleId.model}` : '—'}
                      <p className="text-xs">{j.vehicleId?.registrationNumber || ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {j.workshopId?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {j.assignedMechanicId ? (
                        (() => {
                          const code = j.assignedMechanicId.employeeCode || 'Mechanic'
                          const name = j.assignedMechanicId.userId?.name
                          return name ? (
                            <span className="whitespace-nowrap">
                              <span style={{ color: FOREGROUND }}>{code}</span>
                              <span className="ml-1" style={{ color: MUTED }}>({name})</span>
                            </span>
                          ) : code
                        })()
                      ) : (
                        <span style={{ color: MUTED }}>Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDate(j.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={j.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/jobs/${j._id}`)}
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
                          onClick={() => openAssign(j)}
                          disabled={TERMINAL_JOB_STATUSES.includes(j.status)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Wrench size={11} />
                          Assign
                        </button>
                        <button
                          type="button"
                          onClick={() => openStatus(j)}
                          disabled={(JOB_NEXT_STATUS[j.status] || []).length === 0}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          Status
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

      <Modal
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={`Advance ${statusTarget?.jobNumber || ''}`}
      >
        <SelectInput
          label="Next Status"
          required
          placeholder="Select next status"
          value={statusValue}
          onChange={(e) => setStatusValue(e.target.value)}
        >
          {(JOB_NEXT_STATUS[statusTarget?.status] || []).map((s) => (
            <option key={s} value={s} style={{ background: PANEL }}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </SelectInput>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setStatusTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleStatus}
            disabled={updating || !statusValue}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Updating...' : 'Update Status'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title={`Assign Mechanic · ${assignTarget?.jobNumber || ''}`}
      >
        <SelectInput
          label="Mechanic"
          required
          placeholder={mechanicsLoading ? 'Loading mechanics…' : 'Select a mechanic'}
          value={assignValue}
          onChange={(e) => setAssignValue(e.target.value)}
        >
          {assignValue === '' && <option value="" disabled style={{ background: PANEL }}>Select a mechanic</option>}
          {mechanicsLoading ? (
            <option disabled style={{ background: PANEL }}>Loading mechanics…</option>
          ) : (
            mechanics.map((m) => (
              <option key={m._id} value={m._id} style={{ background: PANEL }}>
                {m.userId?.name || m.employeeCode}
                {(m.specialization || []).length > 0 ? ` · ${m.specialization.join(', ')}` : ''}
              </option>
            ))
          )}
        </SelectInput>
        <p className="text-xs mt-2" style={{ color: MUTED }}>
          Workshop: {assignTarget?.workshopId?.name || '—'}
        </p>
        <div className="flex items-center justify-end gap-3 mt-5">
          <button
            type="button"
            onClick={() => setAssignTarget(null)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={updating || !assignValue}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {updating ? 'Assigning...' : 'Assign Mechanic'}
          </button>
        </div>
      </Modal>

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
                  {b.bookingNumber} · {b.vehicleId ? `${b.vehicleId.make} ${b.vehicleId.model}` : 'Vehicle'} · {b.pricing?.total != null ? `₹${b.pricing.total.toLocaleString('en-IN')}` : ''}
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