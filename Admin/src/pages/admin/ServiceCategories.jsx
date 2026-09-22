import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { Layers, Plus, Pencil } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { TextInput, TextArea } from '../../components/Field'
import { listServiceCategories, createServiceCategory, updateServiceCategory } from '../../services/serviceCategoryApi'
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

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  displayOrder: 1,
}

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export default function ServiceCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const reload = useCallback(async () => {
    try {
      const res = await listServiceCategories({ limit: 100, sortBy: 'displayOrder', sortOrder: 'asc' })
      setCategories(res.data?.categories || res.data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    listServiceCategories({ limit: 100, sortBy: 'displayOrder', sortOrder: 'asc' })
      .then((res) => {
        if (!cancelled) setCategories(res.data?.categories || res.data || [])
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
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      displayOrder: c.displayOrder || 1,
    })
    setModalOpen(true)
  }

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: (form.slug.trim() || slugify(form.name)) || undefined,
        description: form.description.trim() || undefined,
        displayOrder: Number(form.displayOrder) || 0,
      }
      if (editing) {
        await updateServiceCategory(editing._id, payload)
        toast.success('Category updated')
      } else {
        await createServiceCategory(payload)
        toast.success('Category created')
      }
      setModalOpen(false)
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (c) => {
    try {
      await updateServiceCategory(c._id, { isActive: !c.isActive })
      toast.success(c.isActive ? 'Category deactivated' : 'Category activated')
      setCategories((list) =>
        list.map((item) => (item._id === c._id ? { ...item, isActive: !item.isActive } : item)),
      )
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Layers size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Service Categories
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Group services into categories
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
            New Category
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No categories yet"
            message="Create service categories to organise your service catalogue."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
              >
                Create Category
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div
                key={c._id}
                className="p-5 transition-colors duration-200"
                style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, opacity: c.isActive ? 1 : 0.5 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
              >
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.25em] mb-1"
                  style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  {c.slug} · #{c.displayOrder}
                </p>
                <p className="text-lg font-black uppercase tracking-wide mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}>
                  {c.name}
                </p>
                <p className="text-xs mb-4" style={{ color: MUTED }}>
                  {c.description || 'No description'}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
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
                    onClick={() => handleToggle(c)}
                    className="px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit · ${editing.name}` : 'New Service Category'}
      >
        <div className="space-y-4">
          <TextInput label="Name" required value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Exterior Detailing" />
          <TextInput label="Slug" value={form.slug} onChange={(e) => setField('slug', e.target.value)} placeholder="exterior-detailing" />
          <TextArea label="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="What does this category include?" />
          <TextInput
            label="Display Order"
            type="number"
            min={0}
            value={form.displayOrder}
            onChange={(e) => setField('displayOrder', e.target.value)}
          />
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
            disabled={saving || !form.name.trim()}
            className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
            onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
          >
            {saving ? 'Saving...' : editing ? 'Update Category' : 'Create Category'}
          </button>
        </div>
      </Modal>
    </div>
  )
}