import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Truck,
  Gauge,
  Camera,
  FileText,
  Trash2,
  ImageIcon,
  ClipboardList,
} from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import { SelectInput } from '../../components/Field'
import { getJob } from '../../services/jobApi'
import { getEstimate } from '../../services/estimateApi'
import { uploadJobMedia, listJobMedia, deleteMedia } from '../../services/mediaApi'
import { formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  PANEL_ACTIVE,
  ghostButtonStyle,
} from '../../config/theme'

const PIPELINE = [
  'CREATED',
  'CHECK_IN',
  'INSPECTION',
  'ESTIMATE_PENDING',
  'CUSTOMER_APPROVAL',
  'APPROVED',
  'ASSIGNED',
  'IN_PROGRESS',
  'QUALITY_CHECK',
  'READY',
  'DELIVERED',
  'COMPLETED',
]

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
      <div
        className="flex items-center justify-center w-9 h-9 shrink-0"
        style={{ background: 'rgba(217,79,61,0.08)' }}
      >
        <Icon size={16} style={{ color: ACCENT }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
          {label}
        </p>
        <p className="text-sm mt-0.5 break-words" style={{ color: FOREGROUND }}>
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

export default function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)

  const [estimate, setEstimate] = useState(null)
  const [media, setMedia] = useState([])
  const [uploadCategory, setUploadCategory] = useState('BEFORE')
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    let cancelled = false
    getJob(jobId)
      .then((res) => { if (!cancelled) setJob(res.data) })
      .catch((err) => { if (!cancelled) toast.error(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [jobId])

  useEffect(() => {
    if (!job?._id) return
    let cancelled = false
    getEstimate(jobId)
      .then((res) => { if (!cancelled) setEstimate(res.data) })
      .catch(() => { if (!cancelled) setEstimate(null) })
    listJobMedia(jobId)
      .then((res) => { if (!cancelled) setMedia(res.data || []) })
      .catch(() => { if (!cancelled) setMedia([]) })
    return () => { cancelled = true }
  }, [job?._id, jobId])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <Spinner label="Loading job..." />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
        <AdminNav />
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg" style={{ color: MUTED }}>Job not found.</p>
          <button
            type="button"
            onClick={() => navigate('/jobs')}
            className="mt-4 px-6 py-3 text-xs font-black uppercase tracking-widest"
            style={{
              background: ACCENT,
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: '0.16em',
            }}
          >
            Back
          </button>
        </div>
      </div>
    )
  }

  const currentIndex = PIPELINE.indexOf(job.status)
  const subtotal = (estimate?.items || []).reduce(
    (s, i) => s + ((i.quantity || 1) * (i.unitPrice || 0)),
    0,
  )
  const discount = estimate?.pricing?.discount || 0
  const tax = estimate?.pricing?.tax || 0
  const total = estimate?.pricing?.total ?? (subtotal - discount + tax)

  const beforePhotos = media.filter((m) => m.category === 'BEFORE')
  const afterPhotos = media.filter((m) => m.category === 'AFTER')
  const otherPhotos = media.filter((m) => m.category !== 'BEFORE' && m.category !== 'AFTER')

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      await uploadJobMedia(job._id, file, uploadCategory)
      toast.success(`${uploadCategory} photo uploaded`)
      const res = await listJobMedia(job._id)
      setMedia(res.data || [])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploadingImage(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (mediaId) => {
    try {
      await deleteMedia(mediaId)
      toast.success('Photo deleted')
      const res = await listJobMedia(job._id)
      setMedia(res.data || [])
    } catch (err) {
      toast.error(err.message)
    }
  }

  const renderPhotoSection = (title, items) => (
    <div>
      <h3
        className="text-sm font-black uppercase tracking-widest mb-3"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
      >
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-xs" style={{ color: MUTED }}>No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map((m) => (
            <div key={m._id} className="relative group" style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}>
              <img src={m.url} alt={m.category} className="w-full h-28 sm:h-32 object-cover" />
              <div className="px-2 py-1.5 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED }}>
                  {formatDateTime(m.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(m._id)}
                  className="p-1 cursor-pointer transition-colors"
                  style={{ color: MUTED, background: 'transparent', border: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = ACCENT }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = MUTED }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/jobs')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h1
            className="text-3xl font-black uppercase tracking-widest"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {job.jobNumber}
          </h1>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm" style={{ color: MUTED }}>
          Booking {job.bookingId?.bookingNumber} · Created {formatDateTime(job.createdAt)}
        </p>

        {/* Pipeline */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <h2
            className="text-base font-black uppercase tracking-widest mb-5"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
          >
            Workflow Progress
          </h2>
          <div className="flex items-start justify-between overflow-x-auto pb-2">
            {PIPELINE.map((stage, i) => {
              const done = currentIndex >= 0 && i < currentIndex
              const current = i === currentIndex
              return (
                <div key={stage} className="flex items-start flex-1 min-w-[70px]">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: done || current ? ACCENT : LINE_STRONG,
                        background: done || current ? 'rgba(217,79,61,0.12)' : 'transparent',
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={13} style={{ color: ACCENT }} />
                      ) : current ? (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: LINE_STRONG }} />
                      )}
                    </div>
                    <span
                      className="mt-1.5 text-[10px] uppercase tracking-wide text-center leading-tight whitespace-nowrap"
                      style={{
                        color: current ? ACCENT : done ? FOREGROUND : MUTED,
                        fontFamily: "'Barlow', sans-serif",
                        fontWeight: current ? 700 : 400,
                      }}
                    >
                      {stage.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="flex-1 mt-3.5 mx-1" style={{ height: 2, background: i < currentIndex ? ACCENT : LINE_STRONG }} />
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job info */}
          <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
            <h2
              className="text-base font-black uppercase tracking-widest mb-3"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Job Details
            </h2>
            <InfoRow icon={User} label="Customer" value={job.customerId?.name} />
            <InfoRow icon={User} label="Contact" value={job.customerId?.phone} />
            <InfoRow icon={ClipboardList} label="Booking" value={job.bookingId?.bookingNumber} />
            <InfoRow icon={ClipboardList} label="Workshop" value={job.workshopId?.name} />
            <InfoRow icon={User} label="Service Advisor" value={job.serviceAdvisorId?.name} />
            <InfoRow icon={User} label="Workshop Manager" value={job.workshopManagerId?.name} />
            <InfoRow icon={User} label="Assigned Mechanic" value={job.assignedMechanicId ? (job.assignedMechanicId.userId?.name ? `${job.assignedMechanicId.employeeCode} (${job.assignedMechanicId.userId.name})` : (job.assignedMechanicId.employeeCode || 'Mechanic')) : 'Unassigned'} />
            <InfoRow icon={Gauge} label="Odometer In" value={job.odometerIn ? `${job.odometerIn.toLocaleString()} km` : null} />
            <InfoRow icon={Gauge} label="Odometer Out" value={job.odometerOut ? `${job.odometerOut.toLocaleString()} km` : null} />
            <InfoRow icon={Truck} label="Check-In" value={formatDateTime(job.checkInAt)} />
            <InfoRow icon={Gauge} label="Started" value={formatDateTime(job.startedAt)} />
            <InfoRow icon={CheckCircle2} label="Completed" value={formatDateTime(job.completedAt)} />
            <InfoRow icon={Truck} label="Expected Completion" value={formatDateTime(job.expectedCompletionAt)} />
          </section>

          {/* Vehicle + notes */}
          <section className="space-y-6">
            <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
              <h2
                className="text-base font-black uppercase tracking-widest mb-3"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Vehicle
              </h2>
              <InfoRow icon={ClipboardList} label="Registration" value={job.vehicleId?.registrationNumber} />
              <InfoRow icon={ClipboardList} label="Model" value={job.vehicleId ? `${job.vehicleId.make} ${job.vehicleId.model}` : null} />
              <InfoRow icon={ClipboardList} label="Colour" value={job.vehicleId?.color} />
            </section>

            {job.customerNotes && (
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.25rem' }}>
                <h2
                  className="text-base font-black uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  Customer Notes
                </h2>
                <p className="text-sm" style={{ color: MUTED }}>{job.customerNotes}</p>
              </section>
            )}

            {job.internalNotes && (
              <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE, padding: '1.25rem' }}>
                <h2
                  className="text-base font-black uppercase tracking-widest mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
                >
                  Internal Notes
                </h2>
                <p className="text-sm" style={{ color: MUTED }}>{job.internalNotes}</p>
              </section>
            )}
          </section>
        </div>

        {/* Estimate */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={18} style={{ color: ACCENT }} />
            <h2
              className="text-base font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
            >
              Estimate
            </h2>
            {estimate && <StatusBadge status={estimate.status} />}
          </div>

          {!estimate ? (
            <p className="text-sm" style={{ color: MUTED }}>
              No estimate has been created for this job yet.
            </p>
          ) : (
            <div>
              <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}` }}>
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                      {['Item', 'Type', 'Qty', 'Unit Price', 'Total'].map((h) => (
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
                    {(estimate.items || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                        <td className="px-4 py-2.5 text-sm" style={{ color: FOREGROUND }}>
                          {item.name}
                          {item.description && (
                            <p className="text-xs" style={{ color: MUTED }}>{item.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: MUTED }}>{item.type}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>{item.quantity}</td>
                        <td className="px-4 py-2.5 text-sm" style={{ color: MUTED }}>₹{item.unitPrice?.toLocaleString('en-IN') || 0}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold" style={{ color: FOREGROUND }}>
                          ₹{((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col items-end gap-1 mt-3 text-sm">
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Subtotal</span>
                  <span style={{ color: FOREGROUND }}>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center gap-6" style={{ color: '#10b981' }}>
                    <span>Discount</span>
                    <span>- ₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex items-center gap-6" style={{ color: MUTED }}>
                  <span>Tax</span>
                  <span style={{ color: FOREGROUND }}>₹{tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center gap-6 text-base font-black" style={{ color: FOREGROUND, borderTop: `1px solid ${LINE_STRONG}`, paddingTop: '0.5rem' }}>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Total</span>
                  <span style={{ color: ACCENT }}>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>
              {estimate.customerResponse?.respondedAt && (
                <p className="text-xs mt-3" style={{ color: MUTED }}>
                  Customer {estimate.status.toLowerCase() === 'approved' ? 'approved' : 'rejected'} this on{' '}
                  {formatDateTime(estimate.customerResponse.respondedAt)}
                  {estimate.customerResponse.remarks ? ` — "${estimate.customerResponse.remarks}"` : ''}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Before / After photos */}
        <section style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL, padding: '1.5rem' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <ImageIcon size={18} style={{ color: ACCENT }} />
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Work Photos
              </h2>
            </div>
            <label
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
            >
              <Camera size={13} />
              {uploadingImage ? 'Uploading...' : 'Add Photo'}
              {!uploadingImage && (
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  name="photo"
                  onChange={handleUploadPhoto}
                />
              )}
            </label>
          </div>
          <div className="mb-5">
            <SelectInput
              label="Photo Category"
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              style={{ width: 'auto' }}
            >
              <option value="BEFORE" style={{ background: PANEL }}>Before Work</option>
              <option value="AFTER" style={{ background: PANEL }}>After Work</option>
              <option value="DAMAGE" style={{ background: PANEL }}>Damage</option>
              <option value="INSPECTION" style={{ background: PANEL }}>Inspection</option>
            </SelectInput>
          </div>
          <div className="space-y-6">
            {renderPhotoSection(`Before Work (${beforePhotos.length})`, beforePhotos)}
            {renderPhotoSection(`After Work (${afterPhotos.length})`, afterPhotos)}
            {otherPhotos.length > 0 && renderPhotoSection(`Other (${otherPhotos.length})`, otherPhotos)}
          </div>
        </section>
      </div>
    </div>
  )
}