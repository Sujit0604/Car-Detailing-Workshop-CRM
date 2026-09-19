import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Car, Plus, Pencil, Trash2, Gauge, Wrench } from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import {
  SelectInput,
  TextInput,
} from '../../components/Field'
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
} from '../../services/vehicleApi'
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

const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']
const TRANSMISSIONS = ['MANUAL', 'AUTOMATIC', 'AMT', 'CVT', 'DCT', 'OTHER']

const EMPTY_FORM = {
  registrationNumber: '',
  make: '',
  model: '',
  variant: '',
  manufacturingYear: '',
  fuelType: 'PETROL',
  transmission: 'MANUAL',
  color: '',
  vin: '',
  odometer: '',
}

export default function VehiclesPage() {
  const navigate = useNavigate()
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const validate = (data) => {
    const errs = {}
    if (!data.registrationNumber?.trim()) {
      errs.registrationNumber = 'Registration number is required'
    } else if (data.registrationNumber.trim().length < 3) {
      errs.registrationNumber = 'Must be at least 3 characters'
    }
    if (!data.make?.trim()) errs.make = 'Make is required'
    if (!data.model?.trim()) errs.model = 'Model is required'
    if (data.manufacturingYear !== '') {
      const year = Number(data.manufacturingYear)
      const maxYear = new Date().getFullYear() + 1
      if (!Number.isInteger(year) || year < 1900 || year > maxYear) {
        errs.manufacturingYear = `Year must be between 1900 and ${maxYear}`
      }
    }
    if (data.odometer !== '') {
      const odometer = Number(data.odometer)
      if (!Number.isFinite(odometer) || odometer < 0) {
        errs.odometer = 'Odometer cannot be negative'
      }
    }
    return errs
  }

  const loadVehicles = async () => {
    try {
      const res = await listVehicles({ limit: 100 })
      setVehicles(res.data?.vehicles || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  useEffect(() => {
    let cancelled = false
    listVehicles({ limit: 100 })
      .then((res) => { if (!cancelled) setVehicles(res.data?.vehicles || []) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (vehicle) => {
    setEditing(vehicle)
    setForm({
      registrationNumber: vehicle.registrationNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      variant: vehicle.variant || '',
      manufacturingYear: vehicle.manufacturingYear || '',
      fuelType: vehicle.fuelType || 'PETROL',
      transmission: vehicle.transmission || 'MANUAL',
      color: vehicle.color || '',
      vin: vehicle.vin || '',
      odometer: vehicle.odometer ?? '',
    })
    setModalOpen(true)
  }

  const updateField = (key) => (e) => {
    setForm((s) => ({ ...s, [key]: e.target.value }))
    setErrors((s) => ({ ...s, [key]: undefined }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    try {
      const payload = { ...form }
      if (payload.manufacturingYear) payload.manufacturingYear = Number(payload.manufacturingYear)
      if (payload.odometer) payload.odometer = Number(payload.odometer)
      if (!payload.variant) delete payload.variant

      if (editing) {
        await updateVehicle(editing._id, payload)
        toast.success('Vehicle updated successfully')
      } else {
        await createVehicle(payload)
        toast.success('Vehicle added successfully')
      }
      setModalOpen(false)
      loadVehicles()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (vehicle) => {
    try {
      await deleteVehicle(vehicle._id)
      toast.success('Vehicle deactivated')
      loadVehicles()
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
              <Car size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Vehicles
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Manage your registered vehicles
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
            Add Vehicle
          </button>
        </div>

        {loading ? (
          <Spinner />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles yet"
            message="Add your first vehicle to book detailing services."
            action={
              <button
                type="button"
                onClick={openAdd}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={primaryButtonStyle}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
              >
                Add Vehicle
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle._id}
                className="p-5 transition-colors duration-200"
                style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = ACCENT)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = LINE_STRONG)}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-11 h-11 shrink-0"
                      style={{ background: 'rgba(217,79,61,0.10)' }}
                    >
                      <Car size={22} style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <p
                        className="text-lg font-black uppercase tracking-wide"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        {vehicle.manufacturingYear} {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs" style={{ color: MUTED }}>
                        {vehicle.variant || 'Standard'} ·{' '}
                        {Object.keys(vehicle.images || {}).length
                          ? `${(vehicle.images || []).length} photos`
                          : 'No photos'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={vehicle.status} />
                </div>

                <div className="space-y-2 text-xs" style={{ color: MUTED }}>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Reg. No.
                    </span>
                    <span className="font-semibold tracking-wider" style={{ color: FOREGROUND }}>
                      {vehicle.registrationNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Fuel
                    </span>
                    <span style={{ color: FOREGROUND }}>{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Gearbox
                    </span>
                    <span style={{ color: FOREGROUND }}>{vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Colour
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: FOREGROUND }}>
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ background: vehicle.color || '#999' }}
                      />
                      {vehicle.color || '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                      Odometer
                    </span>
                    <span className="flex items-center gap-1.5" style={{ color: FOREGROUND }}>
                      <Gauge size={12} style={{ color: ACCENT }} />
                      {vehicle.odometer !== undefined ? vehicle.odometer.toLocaleString() : '—'} km
                    </span>
                  </div>
                  {vehicle.vin && (
                    <div className="flex items-center justify-between">
                      <span className="uppercase tracking-widest" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        VIN
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: FOREGROUND }}>
                        {vehicle.vin}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-5 pt-4" style={{ borderTop: `1px solid ${LINE_STRONG}` }}>
                  <button
                    type="button"
                    onClick={() => navigate('/book-service', { state: { vehicleId: vehicle._id } })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                    style={primaryButtonStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
                  >
                    <Wrench size={13} />
                    Book
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(vehicle)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(vehicle)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                    style={ghostButtonStyle}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                  >
                    <Trash2 size={13} />
                    Remove
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
        title={editing ? 'Edit Vehicle' : 'Add Vehicle'}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {Object.keys(errors).length > 0 && (
            <div
              className="px-4 py-3 text-xs font-semibold uppercase tracking-widest"
              style={{ border: '1px solid rgba(217,79,61,0.4)', background: 'rgba(217,79,61,0.08)', color: ACCENT }}
            >
              Please fix the highlighted fields before saving
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <TextInput
                label="Registration Number"
                required
                value={form.registrationNumber}
                onChange={updateField('registrationNumber')}
                placeholder="MH12 AB 1234"
              />
              {errors.registrationNumber && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: ACCENT }}>{errors.registrationNumber}</p>
              )}
            </div>
            <div>
              <TextInput
                label="VIN"
                value={form.vin}
                onChange={updateField('vin')}
                placeholder="Chassis number"
              />
            </div>
            <div>
              <TextInput label="Make" required value={form.make} onChange={updateField('make')} placeholder="BMW" />
              {errors.make && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: ACCENT }}>{errors.make}</p>
              )}
            </div>
            <div>
              <TextInput label="Model" required value={form.model} onChange={updateField('model')} placeholder="5 Series" />
              {errors.model && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: ACCENT }}>{errors.model}</p>
              )}
            </div>
            <TextInput label="Variant" value={form.variant} onChange={updateField('variant')} placeholder="530d" />
            <div>
              <TextInput
                label="Manufacturing Year"
                type="number"
                value={form.manufacturingYear}
                onChange={updateField('manufacturingYear')}
                placeholder="2021"
                min={1900}
              />
              {errors.manufacturingYear && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: ACCENT }}>{errors.manufacturingYear}</p>
              )}
            </div>
            <SelectInput label="Fuel Type" value={form.fuelType} onChange={updateField('fuelType')}>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f} style={{ background: PANEL }}>{f}</option>
              ))}
            </SelectInput>
            <SelectInput label="Transmission" value={form.transmission} onChange={updateField('transmission')}>
              {TRANSMISSIONS.map((t) => (
                <option key={t} value={t} style={{ background: PANEL }}>{t}</option>
              ))}
            </SelectInput>
            <TextInput label="Color" value={form.color} onChange={updateField('color')} placeholder="Alpine White" />
            <div>
              <TextInput
                label="Odometer (km)"
                type="number"
                value={form.odometer}
                onChange={updateField('odometer')}
                placeholder="24500"
                min={0}
              />
              {errors.odometer && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: ACCENT }}>{errors.odometer}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={primaryButtonStyle}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
              onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
            >
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}