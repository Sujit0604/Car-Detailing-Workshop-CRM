import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { CalendarPlus, Plus, Trash2, AlertTriangle, Car } from 'lucide-react'
import AppNav from '../../components/AppNav'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import {
  SelectInput,
  TextArea,
  TextInput,
} from '../../components/Field'
import { createBooking } from '../../services/bookingApi'
import { listVehicles } from '../../services/vehicleApi'
import { listWorkshops, listServices } from '../../services/masterApi'
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

function ServiceRow({ services, value, onChange, onRemove }) {
  const index = value.idx
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-end gap-3 p-4"
      style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
    >
      <div className="flex-1">
        <SelectInput
          label="Service"
          required
          placeholder="Select a service"
          value={value.serviceId}
          onChange={(e) => onChange(index, { serviceId: e.target.value, quantity: 1 })}
        >
          {services.map((s) => (
            <option key={s._id} value={s._id} style={{ background: PANEL }}>
              {s.name} — ₹{s.basePrice?.toLocaleString()}
            </option>
          ))}
        </SelectInput>
      </div>
      <div className="w-full sm:w-28">
        <TextInput
          label="Qty"
          type="number"
          min={1}
          value={value.quantity}
          onChange={(e) => onChange(index, { ...value, quantity: Number(e.target.value) })}
        />
      </div>
      {index > 0 && (
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-3 text-[11px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={ghostButtonStyle}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

export default function BookServicePage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [vehicles, setVehicles] = useState([])
  const [workshops, setWorkshops] = useState([])
  const [services, setServices] = useState([])
  const [masterUnavailable, setMasterUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    vehicleId: location.state?.vehicleId || '',
    workshopId: '',
    date: '',
    startTime: '',
    endTime: '',
    couponCode: '',
    customerNotes: '',
  })
  const [serviceRows, setServiceRows] = useState([{ idx: 0, serviceId: '', quantity: 1 }])

  const load = useCallback(async () => {
    try {
      const [vehRes, wsRes] = await Promise.allSettled([
        listVehicles({ limit: 100 }),
        listWorkshops({ limit: 100 }),
      ])

      setVehicles(vehRes.status === 'fulfilled' ? vehRes.value.data?.vehicles || [] : [])

      if (wsRes.status === 'fulfilled') {
        const list = wsRes.value.data?.workshops || wsRes.value.data || []
        setWorkshops(Array.isArray(list) ? list : [])
      } else {
        setMasterUnavailable(true)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!form.workshopId) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      return listServices({ workshopId: form.workshopId, limit: 100 })
    }).then((res) => {
      if (cancelled) return
      const list = res?.data?.services || res?.data || []
      setServices(Array.isArray(list) ? list.filter((s) => s.isActive !== false) : [])
    }).catch(() => {
      if (cancelled) return
      setMasterUnavailable(true)
    })
    return () => {
      cancelled = true
    }
  }, [form.workshopId])

  const updateForm = (key) => (e) => setForm((s) => ({ ...s, [key]: e.target.value }))

  const addServiceRow = () =>
    setServiceRows((rows) => [...rows, { idx: rows.length, serviceId: '', quantity: 1 }])

  const removeServiceRow = (idx) =>
    setServiceRows((rows) => rows.filter((r) => r.idx !== idx))

  const updateServiceRow = (idx, data) =>
    setServiceRows((rows) => rows.map((r) => (r.idx === idx ? { ...r, ...data } : r)))

  const selectedServices = serviceRows.filter((r) => r.serviceId)
  const subtotal = selectedServices.reduce((sum, r) => {
    const s = services.find((sv) => sv._id === r.serviceId)
    return sum + (s ? s.basePrice * r.quantity : 0)
  }, 0)

  const canSubmit =
    form.vehicleId &&
    form.workshopId &&
    form.date &&
    form.startTime &&
    selectedServices.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('Please fill in all required fields')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        vehicleId: form.vehicleId,
        workshopId: form.workshopId,
        appointment: {
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime || undefined,
        },
        services: selectedServices.map((r) => ({
          serviceId: r.serviceId,
          quantity: r.quantity,
        })),
        customerNotes: form.customerNotes || undefined,
        couponCode: form.couponCode.trim() || undefined,
      }
      const res = await createBooking(payload)
      toast.success(res.message || 'Booking created successfully')
      navigate('/bookings')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CalendarPlus size={22} style={{ color: ACCENT }} />
            <h1
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Book a Service
            </h1>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>
            Schedule your detailing appointment
          </p>
        </div>

        {masterUnavailable && (
          <div
            className="flex items-start gap-3 p-4 text-sm"
            style={{ border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.06)' }}
          >
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold" style={{ color: '#fbbf24' }}>
                Master data (workshops / services) is not available yet
              </p>
              <p className="mt-1" style={{ color: MUTED }}>
                The booking API is ready, but workshops and services must be seeded via the
                Workshop and Service backend modules before you can submit a booking.
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <Spinner />
        ) : vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles registered"
            message="Add a vehicle first, then come back to book a service."
            action={
              <button
                type="button"
                onClick={() => navigate('/vehicles')}
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
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <section
              className="p-5 space-y-4"
              style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
            >
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Vehicle & Workshop
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectInput
                  label="Vehicle"
                  required
                  placeholder="Select your vehicle"
                  value={form.vehicleId}
                  onChange={updateForm('vehicleId')}
                >
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id} style={{ background: PANEL }}>
                      {v.manufacturingYear} {v.make} {v.model} — {v.registrationNumber}
                    </option>
                  ))}
                </SelectInput>
                <SelectInput
                  label="Workshop"
                  required
                  placeholder={workshops.length ? 'Select workshop' : 'No workshops available'}
                  value={form.workshopId}
                  onChange={updateForm('workshopId')}
                  disabled={workshops.length === 0}
                >
                  {workshops.map((w) => (
                    <option key={w._id} value={w._id} style={{ background: PANEL }}>
                      {w.name}
                      {w.address?.city ? ` · ${w.address.city}` : ''}
                    </option>
                  ))}
                </SelectInput>
                <TextInput
                  label="Appointment Date"
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={form.date}
                  onChange={updateForm('date')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Start Time"
                    type="time"
                    required
                    value={form.startTime}
                    onChange={updateForm('startTime')}
                  />
                  <TextInput
                    label="End Time"
                    type="time"
                    value={form.endTime}
                    onChange={updateForm('endTime')}
                  />
                </div>
              </div>
            </section>

            <section
              className="p-5 space-y-4"
              style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
            >
              <div className="flex items-center justify-between">
                <h2
                  className="text-base font-black uppercase tracking-widest"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  Services
                </h2>
                <button
                  type="button"
                  onClick={addServiceRow}
                  disabled={services.length === 0}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={primaryButtonStyle}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
                >
                  <Plus size={13} />
                  Add Service
                </button>
              </div>

              {!form.workshopId ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  Select a workshop to load its services.
                </p>
              ) : services.length === 0 ? (
                <p className="text-sm" style={{ color: MUTED }}>
                  No services available at this workshop yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {serviceRows.map((row) => (
                    <ServiceRow
                      key={row.idx}
                      services={services}
                      value={row}
                      onChange={updateServiceRow}
                      onRemove={removeServiceRow}
                    />
                  ))}
                </div>
              )}
            </section>

            <section
              className="p-5 space-y-4"
              style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
            >
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Coupon & Notes
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextInput
                  label="Coupon Code"
                  value={form.couponCode}
                  onChange={updateForm('couponCode')}
                  placeholder="DETAIL15"
                />
                <TextArea
                  label="Notes for the workshop"
                  rows={2}
                  value={form.customerNotes}
                  onChange={updateForm('customerNotes')}
                  placeholder="Anything the team should know..."
                />
              </div>
            </section>

            <section
              className="p-5"
              style={{ border: `1px solid ${ACCENT}`, background: 'rgba(217,79,61,0.05)' }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Estimated Subtotal
                </span>
                <span className="text-xl font-black" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: MUTED }}>
                Discount, taxes and final total are calculated on the server once the booking is submitted.
              </p>
            </section>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                style={ghostButtonStyle}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !canSubmit}
                className="px-8 py-3.5 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={primaryButtonStyle}
                onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = ACCENT_HOVER }}
                onMouseLeave={(e) => { e.currentTarget.style.background = ACCENT }}
              >
                {submitting ? 'Submitting...' : 'Submit Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}