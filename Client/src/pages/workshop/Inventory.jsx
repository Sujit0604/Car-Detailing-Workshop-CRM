import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Minus,
  SlidersHorizontal,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
  TextInput,
} from '../../components/Field'
import { listWorkshops } from '../../services/masterApi'
import {
  listInventoryParts,
  createInventoryPart,
  updateInventoryPart,
  adjustStock,
  deleteInventoryPart,
} from '../../services/inventoryApi'
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

const EMPTY_FORM = {
  workshopId: '',
  partNumber: '',
  name: '',
  category: '',
  brand: '',
  unit: '',
  purchasePrice: '',
  sellingPrice: '',
  quantity: '',
  reorderLevel: '',
  maxStockLevel: '',
  supplierName: '',
  supplierContact: '',
  location: '',
}

export default function InventoryPage() {
  const [workshops, setWorkshops] = useState([])
  const [workshopId, setWorkshopId] = useState('')
  const [parts, setParts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [adjustForm, setAdjustForm] = useState({ adjustment: '', reason: '' })

  useEffect(() => {
    let cancelled = false
    listWorkshops({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const list = res.data?.workshops || res.data || []
        setWorkshops(Array.isArray(list) ? list : [])
        setWorkshopId((prev) => prev || (Array.isArray(list) && list[0]?._id) || '')
      })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!workshopId) return
    let cancelled = false
    listInventoryParts({
      workshopId,
      limit: 100,
      search: search || undefined,
    })
      .then((res) => { if (!cancelled) setParts(res.data?.parts || []) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [workshopId, search])

  const loadParts = async () => {
    if (!workshopId) return
    try {
      const res = await listInventoryParts({ workshopId, limit: 100 })
      setParts(res.data?.parts || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const visibleParts = lowStockOnly
    ? parts.filter((p) => p.stock?.quantity <= p.stock?.reorderLevel)
    : parts

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, workshopId })
    setModalOpen(true)
  }

  const openEdit = (part) => {
    setEditing(part)
    setForm({
      workshopId: part.workshopId?._id || part.workshopId,
      partNumber: part.partNumber || '',
      name: part.name || '',
      category: part.category || '',
      brand: part.brand || '',
      unit: part.unit || '',
      purchasePrice: part.purchasePrice ?? '',
      sellingPrice: part.sellingPrice ?? '',
      quantity: part.stock?.quantity ?? '',
      reorderLevel: part.stock?.reorderLevel ?? '',
      maxStockLevel: part.stock?.maxStockLevel ?? '',
      supplierName: part.supplier?.name || '',
      supplierContact: part.supplier?.contact || '',
      location: part.location || '',
    })
    setModalOpen(true)
  }

  const updateField = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name?.trim() || !form.partNumber?.trim()) {
      toast.error('Part number and name are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        workshopId: form.workshopId,
        partNumber: form.partNumber,
        name: form.name,
        category: form.category || undefined,
        brand: form.brand || undefined,
        unit: form.unit || undefined,
        purchasePrice: form.purchasePrice !== '' ? Number(form.purchasePrice) : undefined,
        sellingPrice: form.sellingPrice !== '' ? Number(form.sellingPrice) : undefined,
        stock: {
          quantity: form.quantity !== '' ? Number(form.quantity) : 0,
          reservedQuantity: 0,
          reorderLevel: form.reorderLevel !== '' ? Number(form.reorderLevel) : 0,
          maxStockLevel: form.maxStockLevel !== '' ? Number(form.maxStockLevel) : 0,
        },
        supplier: {
          name: form.supplierName || undefined,
          contact: form.supplierContact || undefined,
        },
        location: form.location || undefined,
      }

      if (editing) {
        await updateInventoryPart(editing._id, payload)
        toast.success('Part updated successfully')
      } else {
        await createInventoryPart(payload)
        toast.success('Part added successfully')
      }
      setModalOpen(false)
      loadParts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAdjust = async (e) => {
    e.preventDefault()
    if (adjustForm.adjustment === '' || Number(adjustForm.adjustment) === 0) {
      toast.error('Enter a non-zero adjustment')
      return
    }
    setSaving(true)
    try {
      await adjustStock(adjustTarget._id, {
        adjustment: Number(adjustForm.adjustment),
        reason: adjustForm.reason || undefined,
      })
      toast.success('Stock adjusted')
      setAdjustTarget(null)
      setAdjustForm({ adjustment: '', reason: '' })
      loadParts()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (part) => {
    try {
      await deleteInventoryPart(part._id)
      toast.success('Part deactivated')
      loadParts()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Package size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Inventory
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Track workshop spare parts and stock levels
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
            Add Part
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <SelectInput
              label="Workshop"
              required
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
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-1.5"
              style={{ color: MUTED, letterSpacing: '0.14em' }}
            >
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Part number, name, brand..."
              className="w-full px-4 py-3 text-sm transition-colors duration-200"
              style={{
                background: '#0c0c0c',
                border: '1px solid #2a2a2a',
                color: FOREGROUND,
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = ACCENT }}
              onBlur={(e) => { e.currentTarget.style.borderColor = LINE_STRONG }}
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setLowStockOnly((s) => !s)}
              className="inline-flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={{
                ...ghostButtonStyle,
                borderColor: lowStockOnly ? ACCENT : LINE_STRONG,
                color: lowStockOnly ? ACCENT : MUTED,
                background: lowStockOnly ? 'rgba(217,79,61,0.08)' : 'transparent',
              }}
            >
              <AlertTriangle size={14} />
              Low Stock Only
            </button>
          </div>
        </div>

        {!workshopId ? (
          <EmptyState
            icon={Package}
            title="Select a workshop"
            message="Choose a workshop to load its inventory."
          />
        ) : loading ? (
          <Spinner />
        ) : visibleParts.length === 0 ? (
          <EmptyState
            icon={Package}
            title={lowStockOnly ? 'No low stock items' : 'No parts in inventory'}
            message={lowStockOnly ? 'All parts are above their reorder level.' : 'Add your first part to start managing inventory.'}
          />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Part', 'Category', 'Price', 'In Stock', 'Reorder', 'Supplier', 'Actions'].map((h) => (
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
                {visibleParts.map((part) => {
                  const isLow = part.stock?.quantity <= part.stock?.reorderLevel
                  return (
                    <tr
                      key={part._id}
                      className="transition-colors duration-150"
                      style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold" style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}>
                          {part.partNumber}
                        </span>
                        <p className="text-xs mt-0.5" style={{ color: FOREGROUND }}>
                          {part.name}
                          {part.brand ? ` · ${part.brand}` : ''}
                        </p>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                        {part.category || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                        ₹{part.sellingPrice?.toLocaleString('en-IN')}
                        <p className="text-xs" style={{ color: MUTED }}>
                          cost ₹{part.purchasePrice?.toLocaleString('en-IN')}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-block px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            background: isLow ? 'rgba(217,79,61,0.12)' : 'rgba(16,185,129,0.12)',
                            color: isLow ? ACCENT : '#10b981',
                            borderRadius: 2,
                          }}
                        >
                          {part.stock?.quantity ?? 0} {part.unit || ''}
                        </span>
                        {isLow && (
                          <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: ACCENT }}>
                            <AlertTriangle size={10} /> Below reorder
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                        {part.stock?.reorderLevel || 0}
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                        {part.supplier?.name || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setAdjustTarget(part); setAdjustForm({ adjustment: '', reason: '' }) }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                            style={primaryButtonStyle}
                            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                          >
                            <SlidersHorizontal size={12} />
                            Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(part)}
                            className="inline-flex items-center justify-center p-1.5 text-[11px] cursor-pointer"
                            style={ghostButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(part)}
                            className="inline-flex items-center justify-center p-1.5 text-[11px] cursor-pointer"
                            style={ghostButtonStyle}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
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
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Part' : 'Add Part'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextInput
              label="Part Number"
              required
              value={form.partNumber}
              onChange={updateField('partNumber')}
              placeholder="BRAKE-PAD-FR"
            />
            <TextInput label="Part Name" required value={form.name} onChange={updateField('name')} placeholder="Front Brake Pads" />
            <TextInput label="Category" value={form.category} onChange={updateField('category')} placeholder="Brakes" />
            <TextInput label="Brand" value={form.brand} onChange={updateField('brand')} placeholder="Bosch" />
            <TextInput label="Unit" value={form.unit} onChange={updateField('unit')} placeholder="set" />
            <TextInput label="Location" value={form.location} onChange={updateField('location')} placeholder="Shelf B2" />
            <TextInput label="Purchase Price" type="number" min={0} value={form.purchasePrice} onChange={updateField('purchasePrice')} placeholder="1200" />
            <TextInput label="Selling Price" type="number" min={0} value={form.sellingPrice} onChange={updateField('sellingPrice')} placeholder="1800" />
            <TextInput label="Quantity In Stock" type="number" min={0} value={form.quantity} onChange={updateField('quantity')} placeholder="10" />
            <TextInput label="Reorder Level" type="number" min={0} value={form.reorderLevel} onChange={updateField('reorderLevel')} placeholder="4" />
            <TextInput label="Max Stock Level" type="number" min={0} value={form.maxStockLevel} onChange={updateField('maxStockLevel')} placeholder="50" />
            <TextInput label="Supplier Name" value={form.supplierName} onChange={updateField('supplierName')} placeholder="Auto Parts Co." />
            <TextInput label="Supplier Contact" value={form.supplierContact} onChange={updateField('supplierContact')} placeholder="+91 98xxx" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={primaryButtonStyle}
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Part'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!adjustTarget} onClose={() => setAdjustTarget(null)} title={`Adjust Stock · ${adjustTarget?.partNumber || ''}`}>
        {adjustTarget && (
          <form onSubmit={handleAdjust} className="space-y-4" noValidate>
            <p className="text-sm" style={{ color: MUTED }}>
              Current stock: <span style={{ color: FOREGROUND }}>{adjustTarget.stock?.quantity} {adjustTarget.unit || ''}</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <TextInput
                  label="Adjustment"
                  type="number"
                  value={adjustForm.adjustment}
                  onChange={(e) => setAdjustForm((s) => ({ ...s, adjustment: e.target.value }))}
                  placeholder="+5 or -2"
                />
                <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
                  Positive adds stock, negative reduces.
                </p>
              </div>
              <TextInput
                label="Reason"
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm((s) => ({ ...s, reason: e.target.value }))}
                placeholder="Stock received / used in job"
              />
            </div>
            <p className="flex items-center gap-2 text-xs" style={{ color: MUTED }}>
              <Minus size={12} /> Exact quantity changes are logged against this part.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={ghostButtonStyle}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
                style={primaryButtonStyle}
              >
                {saving ? 'Updating...' : 'Update Stock'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}