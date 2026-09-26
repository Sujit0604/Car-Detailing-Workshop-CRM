import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ClipboardCheck, Plus, Pencil, CheckCircle2, Eye, Trash2 } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextInput, TextArea } from '../../components/Field'
import { listInspections, createInspection, updateInspection, completeInspection } from '../../services/inspectionApi'
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

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, items: [] })
    setModalOpen(true)
  }

  const openEdit = (inspection) => {
    setEditing(inspection)
    setForm({
      jobId: '',
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
    if (!editing && !form.jobId.trim()) {
      toast.error('Job id is required')
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
        await createInspection({ ...payload, jobId: form.jobId.trim() })
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
              <TextInput
                label="Job Id"
                required
                value={form.jobId}
                onChange={updateField('jobId')}
                placeholder="Job ObjectId"
              />
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
