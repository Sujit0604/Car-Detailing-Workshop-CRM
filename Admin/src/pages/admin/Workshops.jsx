import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Building2, Plus, Pencil, Users, UserCog, Headset, Wrench } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { TextInput, TextArea, SelectInput } from '../../components/Field'
import { listWorkshops, getWorkshopStaff, createWorkshop, updateWorkshop } from '../../services/workshopApi'
import { formatDate } from '../../utils/transitions'
import {
  ACCENT,
  ACCENT_HOVER,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../../config/theme'

const WORKSHOP_STATUSES = ['ACTIVE', 'INACTIVE', 'TEMPORARILY_CLOSED']

const emptyForm = {
  name: '',
  code: '',
  description: '',
  phone: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  slotDurationMinutes: 60,
  maxBookingsPerSlot: 2,
  status: 'ACTIVE',
}

export default function Workshops() {
  const [workshops, setWorkshops] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const [staffTarget, setStaffTarget] = useState(null)
  const [staffData, setStaffData] = useState(null)
  const [staffLoading, setStaffLoading] = useState(false)

const reload = useCallback(async () => {
    try {
      const res = await listWorkshops({ page, limit: 12, sortBy: 'createdAt', sortOrder: 'desc' })
      setWorkshops(res.data?.workshops || [])
      setPagination(res.data?.pagination || { page: 1, totalPages: 1, total: 0 })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    let cancelled = false
    listWorkshops({ page, limit: 12, sortBy: 'createdAt', sortOrder: 'desc' })
      .then((res) => {
        if (!cancelled) {
          setWorkshops(res.data?.workshops || [])
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
  }, [page])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (w) => {
    setEditing(w)
    setForm({
      name: w.name || '',
      code: w.code || '',
      description: w.description || '',
      phone: w.phone || '',
      email: w.email || '',
      line1: w.address?.line1 || '',
      line2: w.address?.line2 || '',
      city: w.address?.city || '',
      state: w.address?.state || '',
      country: w.address?.country || '',
      postalCode: w.address?.postalCode || '',
      slotDurationMinutes: w.slotDurationMinutes || 60,
      maxBookingsPerSlot: w.maxBookingsPerSlot || 2,
      status: w.status || 'ACTIVE',
    })
    setModalOpen(true)
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || undefined,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        address: {
          line1: form.line1.trim() || undefined,
          line2: form.line2.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          country: form.country.trim() || undefined,
          postalCode: form.postalCode.trim() || undefined,
        },
        slotDurationMinutes: Number(form.slotDurationMinutes) || 30,
        maxBookingsPerSlot: Number(form.maxBookingsPerSlot) || 1,
        status: form.status,
      }
      if (editing) {
        await updateWorkshop(editing._id, payload)
        toast.success('Workshop updated')
      } else {
        await createWorkshop(payload)
        toast.success('Workshop created')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (w) => {
    const nextStatus = w.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
    try {
      await updateWorkshop(w._id, { status: nextStatus })
      toast.success(`Workshop ${nextStatus === 'ACTIVE' ? 'activated' : 'deactivated'}`)
      setWorkshops((list) =>
        list.map((item) => (item._id === w._id ? { ...item, status: nextStatus } : item)),
      )
    } catch (err) {
      toast.error(err.message)
    }
  }

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const openStaff = async (w) => {
    setStaffTarget(w)
    setStaffData(null)
    setStaffLoading(true)
    try {
      const res = await getWorkshopStaff(w._id)
      setStaffData(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setStaffLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Building2 size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Workshops
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {pagination.total} workshops registered
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            <Plus size={15} />
            New Workshop
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : workshops.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No workshops yet"
            message="Create your first workshop to start accepting bookings."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
              >
                Create Workshop
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {workshops.map((w) => (
              <div
                key={w._id}
                className="p-5 transition-colors duration-200"
                style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-11 h-11 shrink-0" style={{ background: 'rgba(217,79,61,0.10)' }}>
                      <Building2 size={20} style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p className="text-base font-black uppercase tracking-wide" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}>
                        {w.name}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {w.code}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={w.status} />
                </div>

                <p className="text-xs text-sm mb-3" style={{ color: MUTED }}>
                  {w.description || 'No description'}
                </p>

                <div className="space-y-1.5 text-xs" style={{ color: MUTED }}>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      {w.phone}
                    </span>
                    <span style={{ color: FOREGROUND }}>
                      {[w.address?.city, w.address?.state].filter(Boolean).join(', ') || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Slot
                    </span>
                    <span style={{ color: FOREGROUND }}>
                      {w.slotDurationMinutes} min · {w.maxBookingsPerSlot} slot
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Staff
                    </span>
                    <span style={{ color: FOREGROUND }}>
                      <span style={{ color: ACCENT }}>{w.staff?.managers || 0}</span> mgr ·{' '}
                      <span style={{ color: ACCENT }}>{w.staff?.advisors || 0}</span> advisor ·{' '}
                      <span style={{ color: ACCENT }}>{w.staff?.mechanics || 0}</span> mechanic
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Created
                    </span>
                    <span style={{ color: FOREGROUND }}>{formatDate(w.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => openEdit(w)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => openStaff(w)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    <Users size={11} />
                    Staff
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(w)}
                    className="px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    {w.status === 'INACTIVE' ? 'Activate' : 'Deactivate'}
                  </button>
                </div>
              </div>
            ))}
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
        title={editing ? `Edit · ${editing.name}` : 'New Workshop'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Workshop name" />
            <TextInput label="Code" required value={form.code} onChange={(e) => setField('code', e.target.value.toUpperCase())} placeholder="SHAIN-01" />
          </div>
          <TextArea label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What does this workshop specialise in?" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Phone" required value={form.phone} onChange={(e) => setField('phone', e.target.value)} placeholder="+91-0000000000" />
            <TextInput label="Email" value={form.email} onChange={(e) => setField('email', e.target.value)} placeholder="workshop@example.com" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Address Line 1" value={form.line1} onChange={(e) => setField('line1', e.target.value)} />
            <TextInput label="Address Line 2" value={form.line2} onChange={(e) => setField('line2', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="City" value={form.city} onChange={(e) => setField('city', e.target.value)} />
            <TextInput label="State" value={form.state} onChange={(e) => setField('state', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput label="Country" value={form.country} onChange={(e) => setField('country', e.target.value)} />
            <TextInput label="Postal Code" value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TextInput
              label="Slot Duration (min)"
              type="number"
              min={5}
              value={form.slotDurationMinutes}
              onChange={(e) => setField('slotDurationMinutes', e.target.value)}
            />
            <TextInput
              label="Max Bookings / Slot"
              type="number"
              min={1}
              value={form.maxBookingsPerSlot}
              onChange={(e) => setField('maxBookingsPerSlot', e.target.value)}
            />
            <SelectInput label="Status" value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {WORKSHOP_STATUSES.map((s) => (
                <option key={s} value={s} style={{ background: PANEL }}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
            style={ghostButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !form.name.trim() || !form.code.trim() || !form.phone.trim()}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {saving ? 'Saving...' : editing ? 'Update Workshop' : 'Create Workshop'}
          </button>
        </div>
      </Modal>

      <Modal
        open={!!staffTarget}
        onClose={() => setStaffTarget(null)}
        title={`Staff · ${staffTarget?.name || ''}`}
        maxWidth="max-w-2xl"
      >
        {staffLoading ? (
          <Spinner />
        ) : !staffData ? (
          <p className="text-sm" style={{ color: MUTED }}>Could not load staff.</p>
        ) : (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <UserCog size={14} style={{ color: ACCENT }} />
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}>
                  Workshop Managers ({staffData.managers?.length || 0})
                </h3>
              </div>
              {staffData.managers?.length ? (
                <div className="space-y-2">
                  {staffData.managers.map((m) => (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2" style={{ border: `1px solid ${LINE_STRONG}` }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>{m.name}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{m.email} · {m.phone}</p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: MUTED }}>No manager posted here yet.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Headset size={14} style={{ color: ACCENT }} />
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}>
                  Service Advisors ({staffData.advisors?.length || 0})
                </h3>
              </div>
              {staffData.advisors?.length ? (
                <div className="space-y-2">
                  {staffData.advisors.map((a) => (
                    <div key={a._id} className="flex items-center justify-between px-3 py-2" style={{ border: `1px solid ${LINE_STRONG}` }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>{a.name}</p>
                        <p className="text-xs" style={{ color: MUTED }}>{a.email} · {a.phone}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: MUTED }}>No service advisor posted here yet.</p>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench size={14} style={{ color: ACCENT }} />
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.12em' }}>
                  Mechanics ({staffData.mechanics?.length || 0})
                </h3>
              </div>
              {staffData.mechanics?.length ? (
                <div className="space-y-2">
                  {staffData.mechanics.map((m) => (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2" style={{ border: `1px solid ${LINE_STRONG}` }}>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: FOREGROUND }}>
                          {m.userId?.name || m.employeeCode}
                        </p>
                        <p className="text-xs" style={{ color: MUTED }}>
                          {m.employeeCode} · {(m.specialization || []).join(', ') || 'General'}
                        </p>
                      </div>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: MUTED }}>No mechanics linked to this workshop.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}