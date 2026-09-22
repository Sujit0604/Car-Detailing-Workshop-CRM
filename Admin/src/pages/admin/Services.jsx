import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Sparkles, Plus, Pencil } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { TextInput, TextArea, SelectInput } from '../../components/Field'
import { listServices, createService, updateService } from '../../services/serviceApi'
import { listWorkshops } from '../../services/workshopApi'
import { listServiceCategories } from '../../services/serviceCategoryApi'
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

const SERVICE_TYPES = ['DETAILING', 'REPAIR', 'MAINTENANCE', 'INSPECTION']
const PRICING_TYPES = ['FIXED', 'STARTING_FROM', 'INSPECTION_REQUIRED']

const emptyForm = {
  workshopId: '',
  categoryId: '',
  name: '',
  description: '',
  serviceType: 'DETAILING',
  pricingType: 'FIXED',
  basePrice: 0,
  estimatedDurationMinutes: 60,
}

export default function Services() {
  const [services, setServices] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [categories, setCategories] = useState([])
  const [workshopFilter, setWorkshopFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    try {
      const params = { limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }
      if (workshopFilter) params.workshopId = workshopFilter
      const res = await listServices(params)
      setServices(res.data?.services || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      listWorkshops({ limit: 100 }),
      listServiceCategories({ limit: 100 }),
    ]).then(([wsRes, catRes]) => {
      if (cancelled) return
      if (wsRes.status === 'fulfilled') {
        const list = wsRes.value.data?.workshops || []
        setWorkshops(Array.isArray(list) ? list : [])
      }
      if (catRes.status === 'fulfilled') {
        const list = catRes.value.data?.categories || []
        setCategories(Array.isArray(list) ? list : [])
      }
    }).catch((err) => {
      if (!cancelled) toast.error(err.message)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const params = { limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }
    if (workshopFilter) params.workshopId = workshopFilter
    listServices(params)
      .then((res) => {
        if (!cancelled) setServices(res.data?.services || [])
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
  }, [workshopFilter])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, workshopId: workshops[0]?._id || '' })
    setModalOpen(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      workshopId: s.workshopId?._id || s.workshopId || workshops[0]?._id || '',
      categoryId: s.categoryId?._id || s.categoryId || '',
      name: s.name || '',
      description: s.description || '',
      serviceType: s.serviceType || 'DETAILING',
      pricingType: s.pricingType || 'FIXED',
      basePrice: s.basePrice || 0,
      estimatedDurationMinutes: s.estimatedDurationMinutes || 60,
    })
    setModalOpen(true)
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        workshopId: form.workshopId,
        categoryId: form.categoryId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        serviceType: form.serviceType,
        pricingType: form.pricingType,
        basePrice: Number(form.basePrice) || 0,
        estimatedDurationMinutes: Number(form.estimatedDurationMinutes) || 0,
      }
      if (editing) {
        await updateService(editing._id, payload)
        toast.success('Service updated')
      } else {
        await createService(payload)
        toast.success('Service created')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (s) => {
    try {
      await updateService(s._id, { isActive: !s.isActive })
      toast.success(s.isActive ? 'Service deactivated' : 'Service activated')
      setServices((list) =>
        list.map((item) => (item._id === s._id ? { ...item, isActive: !item.isActive } : item)),
      )
    } catch (err) {
      toast.error(err.message)
    }
  }

  const workshopName = (id) => {
    if (typeof id === 'object' && id !== null) return id.name || '—'
    return workshops.find((w) => w._id === id)?.name || '—'
  }

  const categoryName = (id) => {
    if (typeof id === 'object' && id !== null) return id.name || '—'
    return categories.find((c) => c._id === id)?.name || '—'
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Sparkles size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Services
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              {services.length} services loaded
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
            New Service
          </button>
        </div>

        <div className="max-w-sm">
          <SelectInput
            label="Workshop"
            placeholder="All workshops"
            value={workshopFilter}
            onChange={(e) => { setWorkshopFilter(e.target.value); setLoading(true) }}
          >
            {workshops.map((w) => (
              <option key={w._id} value={w._id} style={{ background: PANEL }}>
                {w.name}
              </option>
            ))}
          </SelectInput>
        </div>

        {loading ? (
          <Spinner />
        ) : services.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No services yet"
            message="Create services under a workshop to start."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
              >
                Create Service
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Service', 'Workshop', 'Category', 'Type', 'Price', 'Duration', 'Status', 'Actions'].map((h) => (
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
                {services.map((s) => (
                  <tr
                    key={s._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}`, opacity: s.isActive ? 1 : 0.55 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#161616' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        {s.name}
                      </span>
                      <p className="text-xs" style={{ color: MUTED }}>{s.slug}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {workshopName(s.workshopId)}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {categoryName(s.categoryId)}
                    </td>
                    <td className="px-5 py-3.5 text-xs uppercase tracking-wider" style={{ color: MUTED }}>
                      {s.serviceType}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: FOREGROUND, fontFamily: "'Barlow Condensed', sans-serif" }}>
                        ₹{(s.basePrice || 0).toLocaleString('en-IN')}
                      </span>
                      <p className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
                        {s.pricingType?.replace(/_/g, ' ')}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {s.estimatedDurationMinutes} min
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Pencil size={11} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggle(s)}
                          className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit · ${editing.name}` : 'New Service'}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput label="Workshop" required value={form.workshopId} onChange={(e) => setField('workshopId', e.target.value)}>
              {workshops.map((w) => (
                <option key={w._id} value={w._id} style={{ background: PANEL }}>
                  {w.name}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Category" required value={form.categoryId} onChange={(e) => setField('categoryId', e.target.value)}>
              {categories.map((c) => (
                <option key={c._id} value={c._id} style={{ background: PANEL }}>
                  {c.name}
                </option>
              ))}
            </SelectInput>
          </div>

          <TextInput label="Service Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full Body Polish" />
          <TextArea label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Service description" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput label="Service Type" value={form.serviceType} onChange={(e) => setField('serviceType', e.target.value)}>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </SelectInput>
            <SelectInput label="Pricing Type" value={form.pricingType} onChange={(e) => setField('pricingType', e.target.value)}>
              {PRICING_TYPES.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </SelectInput>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Base Price (₹)"
              type="number"
              min={0}
              value={form.basePrice}
              onChange={(e) => setField('basePrice', e.target.value)}
            />
            <TextInput
              label="Estimated Duration (min)"
              type="number"
              min={0}
              value={form.estimatedDurationMinutes}
              onChange={(e) => setField('estimatedDurationMinutes', e.target.value)}
            />
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
            disabled={saving || !form.name.trim() || !form.workshopId || !form.categoryId}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {saving ? 'Saving...' : editing ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      </Modal>
    </div>
  )
}