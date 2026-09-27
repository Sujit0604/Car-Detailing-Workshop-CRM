import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardCheck, Plus, Pencil, CheckCircle2, Eye, Trash2, Search } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextInput, TextArea } from '../../components/Field'
import { listInspections, createInspection, updateInspection, completeInspection } from '../../services/inspectionApi'
import { listAllJobs } from '../../services/adminApi'
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

const INSPECTION_TYPES = ['INITIAL', 'FINAL', 'REINSPECTION']
const CONDITIONS = ['GOOD', 'FAIR', 'POOR', 'DAMAGED', 'REPLACE_REQUIRED']
const TYPE_FILTERS = ['ALL', ...INSPECTION_TYPES]
const STATUS_FILTERS = ['ALL', 'DRAFT', 'COMPLETED']
// These are the statuses an inspection actually advances the job from, so they
// are listed first in the picker. The list is never limited to them.
const INSPECTABLE_STATUSES = ['INSPECTION', 'REWORK', 'ESTIMATE_PENDING']

const EMPTY_FORM = {
  jobId: '',
  inspectionType: 'INITIAL',
  odometerReading: '',
  fuelLevel: '',
  exteriorCondition: '',
  interiorCondition: '',
  notes: '',
  items: [],
}

const emptyItem = () => ({ component: '', condition: 'GOOD', notes: '', recommendedAction: '' })

export default function Inspections() {
  const [inspections, setInspections] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [inspectionType, setInspectionType] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [detail, setDetail] = useState(null)
  const [jobs, setJobs] = useState([])
  const [jobsLoaded, setJobsLoaded] = useState(false)
  const [jobQuery, setJobQuery] = useState('')

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (inspectionType !== 'ALL') params.inspectionType = inspectionType
    if (status !== 'ALL') params.status = status

    let cancelled = false
    listInspections(params)
      .then((res) => {
        if (cancelled) return
        setInspections(res.data?.inspections || [])
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
  }, [page, inspectionType, status])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  // Jobs are only needed to populate the "New Inspection" picker, so they are
  // fetched lazily the first time the modal is opened.
  useEffect(() => {
    if (!modalOpen || jobsLoaded) return

    let cancelled = false

    listAllJobs({ page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => {
        if (cancelled) return
        setJobs(res.data?.jobs || [])
        setJobsLoaded(true)
      })
      .catch((err) => {
        if (cancelled) return
        toast.error(err.message)
        setJobsLoaded(true)
      })

    return () => {
      cancelled = true
    }
  }, [modalOpen, jobsLoaded])

  const jobsLoading = modalOpen && !jobsLoaded
  const formJobId = (form.jobId || '').trim()

  // Matches whatever the admin typed against the fetched job list, so both a
  // job number and an ObjectId resolve to the same highlighted job.
  const selectedJob = useMemo(() => {
    const term = (form.jobId || '').trim().toLowerCase()
    if (!term) return null
    return (
      jobs.find(
        (job) =>
          job._id?.toLowerCase() === term ||
          job.jobNumber?.toLowerCase() === term,
      ) || null
    )
  }, [form.jobId, jobs])

  // Every job stays selectable: the server resolves any job number, and a job can
  // be inspected from more than one status. Inspectable jobs are only sorted to
  // the top, never filtered out.
  const selectableJobs = useMemo(() => {
    const needle = jobQuery.trim().toLowerCase()

    const matches = needle
      ? jobs.filter((job) =>
          [
            job.jobNumber,
            job._id,
            job.status,
            job.customerId?.name,
            job.customerId?.phone,
            job.vehicleId?.registrationNumber,
            job.vehicleId?.make,
            job.vehicleId?.model,
          ]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(needle)),
        )
      : jobs

    const rank = (job) => (INSPECTABLE_STATUSES.includes(job.status) ? 0 : 1)

    return [...matches].sort(
      (a, b) => rank(a) - rank(b) || (a.jobNumber < b.jobNumber ? 1 : -1),
    )
  }, [jobs, jobQuery])

  const selectJob = (jobId) => {
    const job = jobs.find((item) => item._id === jobId)
    setForm((s) => ({ ...s, jobId: job ? job.jobNumber || job._id : '' }))
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, items: [] })
    setJobQuery('')
    setModalOpen(true)
  }

  const openEdit = (inspection) => {
    setEditing(inspection)
    setForm({
      jobId:
        typeof inspection.jobId === 'string'
          ? inspection.jobId
          : inspection.jobId?.jobNumber || inspection.jobId?._id || '',
      inspectionType: inspection.inspectionType || 'INITIAL',
      odometerReading: inspection.odometerReading ?? '',
      fuelLevel: inspection.fuelLevel ?? '',
      exteriorCondition: inspection.exteriorCondition || '',
      interiorCondition: inspection.interiorCondition || '',
      notes: inspection.notes || '',
      items: (inspection.items || []).map((item) => ({
        component: item.component || '',
        condition: item.condition || 'GOOD',
        notes: item.notes || '',
        recommendedAction: item.recommendedAction || '',
        images: item.images || [],
      })),
    })
    setModalOpen(true)
  }

  const updateField = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const updateItem = (index, key, value) => {
    setForm((s) => ({
      ...s,
      items: s.items.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)),
    }))
  }

  const addItem = () => setForm((s) => ({ ...s, items: [...s.items, emptyItem()] }))

  const removeItem = (index) => {
    setForm((s) => ({ ...s, items: s.items.filter((_, idx) => idx !== index) }))
  }

  const buildItems = () =>
    form.items
      .filter((item) => item.component.trim())
      .map((item) => ({
        component: item.component.trim(),
        condition: item.condition,
        notes: item.notes.trim() || undefined,
        recommendedAction: item.recommendedAction.trim() || undefined,
        images: item.images?.length ? item.images : undefined,
      }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const jobId = (form.jobId || '').trim()

    if (!editing && !jobId) {
      toast.error('Select a job, or type its job number')
      return
    }

    setSaving(true)
    try {
      const payload = {
        inspectionType: form.inspectionType,
        odometerReading: form.odometerReading !== '' ? Number(form.odometerReading) : undefined,
        fuelLevel: form.fuelLevel !== '' ? Number(form.fuelLevel) : undefined,
        exteriorCondition: form.exteriorCondition.trim() || undefined,
        interiorCondition: form.interiorCondition.trim() || undefined,
        notes: form.notes.trim() || undefined,
        items: buildItems(),
      }

      if (editing) {
        await updateInspection(editing._id, payload)
        toast.success('Inspection updated')
      } else {
        await createInspection({ ...payload, jobId })
        toast.success('Inspection created')
      }
      setModalOpen(false)
      setPage(1)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async (inspection) => {
    setSaving(true)
    try {
      await completeInspection(inspection._id)
      toast.success('Inspection completed')
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ClipboardCheck size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Inspections
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} vehicle inspections recorded
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <Plus size={16} />
            New Inspection
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setInspectionType(t); setPage(1); setLoading(true) }}
                className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.1em',
                  border: `1px solid ${inspectionType === t ? ACCENT : LINE_STRONG}`,
                  color: inspectionType === t ? '#fff' : MUTED,
                  background: inspectionType === t ? ACCENT : 'transparent',
                }}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setStatus(s); setPage(1); setLoading(true) }}
                className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer"
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  letterSpacing: '0.1em',
                  border: `1px solid ${status === s ? ACCENT : LINE_STRONG}`,
                  color: status === s ? '#fff' : MUTED,
                  background: status === s ? ACCENT : 'transparent',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Spinner />
        ) : inspections.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No inspections found"
            message="Record an inspection to document vehicle condition before and after work."
          />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Job', 'Type', 'Inspector', 'Odometer', 'Fuel', 'Items', 'Status', 'Created', 'Actions'].map((h) => (
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
                {inspections.map((ins) => (
                  <tr
                    key={ins._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {ins.jobId?.jobNumber || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: MUTED }}>{ins.inspectionType}</td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {ins.inspectorId?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {ins.odometerReading != null ? `${ins.odometerReading.toLocaleString('en-IN')} km` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {ins.fuelLevel != null ? `${ins.fuelLevel}%` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>{ins.items?.length || 0}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={ins.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDateTime(ins.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetail(ins)}
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
                          onClick={() => openEdit(ins)}
                          disabled={ins.status === 'COMPLETED'}
                          title={ins.status === 'COMPLETED' ? 'Completed inspections cannot be edited' : 'Edit inspection'}
                          className="inline-flex items-center justify-center p-1.5 text-[11px] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = ACCENT; if (!e.currentTarget.disabled) e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleComplete(ins)}
                          disabled={ins.status === 'COMPLETED' || saving}
                          title={ins.status === 'COMPLETED' ? 'Inspection already completed' : 'Complete inspection'}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          style={primaryButtonStyle}
                        >
                          <CheckCircle2 size={11} />
                          Complete
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Inspection' : 'New Inspection'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!editing && (
              <div className="sm:col-span-3 space-y-3">
                <div
                  className="flex items-center gap-2 px-3"
                  style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE }}
                >
                  <Search size={14} style={{ color: MUTED, flexShrink: 0 }} />
                  <input
                    type="text"
                    value={jobQuery}
                    onChange={(e) => setJobQuery(e.target.value)}
                    placeholder="Search jobs by number, customer, registration or status"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                    style={{ color: FOREGROUND }}
                  />
                  {jobQuery && (
                    <button
                      type="button"
                      onClick={() => setJobQuery('')}
                      aria-label="Clear search"
                      className="text-xs font-black uppercase tracking-widest cursor-pointer"
                      style={{ color: MUTED }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <SelectInput
                  label={`Job${jobQuery ? ` (${selectableJobs.length} match${selectableJobs.length === 1 ? '' : 'es'})` : ` (${jobs.length} total)`}`}
                  value={selectedJob?._id || ''}
                  onChange={(e) => selectJob(e.target.value)}
                  placeholder={jobsLoading ? 'Loading jobs...' : 'Select a job to inspect'}
                  disabled={jobsLoading}
                >
                  {selectableJobs.map((job) => (
                    <option key={job._id} value={job._id} style={{ background: PANEL }}>
                      {INSPECTABLE_STATUSES.includes(job.status) ? '' : '· '}
                      {job.jobNumber} · {job.customerId?.name || 'Unknown'} ·{' '}
                      {job.vehicleId?.registrationNumber || 'No reg'} · {job.status}
                    </option>
                  ))}
                </SelectInput>

                <TextInput
                  label="Job Number or Id"
                  required
                  value={form.jobId}
                  onChange={updateField('jobId')}
                  placeholder="JOB-2026-AB12CD34"
                  list="inspection-job-options"
                />
                <datalist id="inspection-job-options">
                  {jobs.map((job) => (
                    <option key={job._id} value={job.jobNumber}>
                      {job.customerId?.name} · {job.vehicleId?.registrationNumber}
                    </option>
                  ))}
                </datalist>

                {selectedJob && (
                  <div
                    className="flex items-start gap-2 text-xs"
                    style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE, padding: '0.75rem' }}
                  >
                    <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
                    <span style={{ color: MUTED }}>
                      {selectedJob.jobNumber} · {selectedJob.customerId?.name} ·{' '}
                      {selectedJob.vehicleId?.registrationNumber} · status {selectedJob.status}
                    </span>
                  </div>
                )}

                {formJobId && !selectedJob && jobsLoaded && (
                  <p className="text-xs" style={{ color: '#f59e0b' }}>
                    That job is not in the loaded list (only the 100 most recent are cached), but
                    you can still create the inspection — the server looks the job up by its number.
                  </p>
                )}

                {jobsLoaded && selectableJobs.length === 0 && (
                  <p className="text-xs" style={{ color: '#f59e0b' }}>
                    No job matches that search. Clear the search box, or type the job number
                    directly below.
                  </p>
                )}

                <p className="text-xs" style={{ color: MUTED }}>
                  Every job is listed here. Prefer to work from the job itself? Open the job and use
                  its inspection section — it fills this in automatically.
                </p>
              </div>
            )}
            <SelectInput
              label="Inspection Type"
              required
              value={form.inspectionType}
              onChange={updateField('inspectionType')}
            >
              {INSPECTION_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>
                  {t}
                </option>
              ))}
            </SelectInput>
            <TextInput
              label="Odometer (km)"
              type="number"
              min={0}
              value={form.odometerReading}
              onChange={updateField('odometerReading')}
              placeholder="45210"
            />
            <TextInput
              label="Fuel Level (%)"
              type="number"
              min={0}
              max={100}
              value={form.fuelLevel}
              onChange={updateField('fuelLevel')}
              placeholder="75"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextArea
              label="Exterior Condition"
              rows={3}
              value={form.exteriorCondition}
              onChange={updateField('exteriorCondition')}
              placeholder="Minor scratches on the left bumper"
            />
            <TextArea
              label="Interior Condition"
              rows={3}
              value={form.interiorCondition}
              onChange={updateField('interiorCondition')}
              placeholder="Seats stained, headliner clean"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-widest" style={{ color: MUTED, letterSpacing: '0.14em' }}>
                Inspection Items
              </span>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={ghostButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
              >
                <Plus size={12} />
                Add Item
              </button>
            </div>

            {form.items.length === 0 ? (
              <p className="text-xs" style={{ color: MUTED }}>No items added yet.</p>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 space-y-3"
                    style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <TextInput
                          label="Component"
                          value={item.component}
                          onChange={(e) => updateItem(index, 'component', e.target.value)}
                          placeholder="Front bumper"
                        />
                        <SelectInput
                          label="Condition"
                          value={item.condition}
                          onChange={(e) => updateItem(index, 'condition', e.target.value)}
                        >
                          {CONDITIONS.map((c) => (
                            <option key={c} value={c} style={{ background: PANEL }}>
                              {c.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </SelectInput>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        aria-label="Remove item"
                        className="mt-6 p-2 cursor-pointer transition-colors"
                        style={ghostButtonStyle}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <TextArea
                        label="Notes"
                        rows={2}
                        value={item.notes}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                      />
                      <TextArea
                        label="Recommended Action"
                        rows={2}
                        value={item.recommendedAction}
                        onChange={(e) => updateItem(index, 'recommendedAction', e.target.value)}
                        placeholder="Replace on next visit"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <TextArea
            label="Notes"
            rows={3}
            value={form.notes}
            onChange={updateField('notes')}
            placeholder="Overall inspection summary"
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Inspection'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Inspection"
        maxWidth="max-w-3xl"
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={detail.status} />
              <span className="text-sm" style={{ color: MUTED }}>{detail.inspectionType}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {[
                ['Job', detail.jobId?.jobNumber],
                ['Inspector', detail.inspectorId?.name],
                ['Odometer', detail.odometerReading != null ? `${detail.odometerReading.toLocaleString('en-IN')} km` : null],
                ['Fuel Level', detail.fuelLevel != null ? `${detail.fuelLevel}%` : null],
                ['Created', formatDateTime(detail.createdAt)],
                ['Completed', formatDateTime(detail.completedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ color: FOREGROUND }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            {detail.exteriorCondition && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Exterior
                </p>
                <p className="text-sm" style={{ color: FOREGROUND }}>{detail.exteriorCondition}</p>
              </div>
            )}
            {detail.interiorCondition && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Interior
                </p>
                <p className="text-sm" style={{ color: FOREGROUND }}>{detail.interiorCondition}</p>
              </div>
            )}
            {detail.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Notes
                </p>
                <p className="text-sm" style={{ color: MUTED }}>{detail.notes}</p>
              </div>
            )}

            {detail.items?.length > 0 && (
              <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      {['Component', 'Condition', 'Notes', 'Recommended Action', 'Photos'].map((h) => (
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
                      <tr key={item.component || idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>{item.component}</td>
                        <td className="px-4 py-2.5"><StatusBadge status={item.condition} /></td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.notes || '—'}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.recommendedAction || '—'}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.images?.length || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
