import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Star, MessageSquare, Reply, ShieldCheck, Eye } from 'lucide-react'
import AdminNav from '../../components/AdminNav'
import StatusBadge from '../../components/StatusBadge'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import Modal from '../../components/Modal'
import { SelectInput, TextArea } from '../../components/Field'
import { listReviews, getReview, respondToReview, moderateReview } from '../../services/reviewApi'
import { formatDateTime } from '../../utils/transitions'
import {
  ACCENT,
  BACKGROUND,
  FOREGROUND,
  LINE_STRONG,
  MUTED,
  PANEL,
  PANEL_ACTIVE,
  primaryButtonStyle,
  ghostButtonStyle,
} from '../../config/theme'

const STATUS_FILTERS = ['ALL', 'FLAGGED', 'PUBLISHED', 'HIDDEN']
const MODERATION_STATUSES = ['PUBLISHED', 'HIDDEN', 'FLAGGED']
const RATINGS = [1, 2, 3, 4, 5]

function RatingStars({ rating, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {RATINGS.map((star) => (
        <Star
          key={star}
          size={size}
          style={{ color: star <= (rating || 0) ? '#fbbf24' : LINE_STRONG }}
          fill={star <= (rating || 0) ? '#fbbf24' : 'transparent'}
        />
      ))}
    </span>
  )
}

export default function Reviews() {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('ALL')
  const [rating, setRating] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [respondTarget, setRespondTarget] = useState(null)
  const [response, setResponse] = useState('')

  const [moderateTarget, setModerateTarget] = useState(null)
  const [moderateForm, setModerateForm] = useState({ status: 'PUBLISHED', reason: '' })

  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    const params = { page, limit: 15, sortBy: 'createdAt', sortOrder: 'desc' }
    if (status !== 'ALL') params.status = status
    if (rating) params.rating = rating

    let cancelled = false
    listReviews(params)
      .then((res) => {
        if (cancelled) return
        setReviews(res.data?.reviews || [])
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
  }, [page, status, rating])

  const goToPage = (next) => {
    if (next < 1 || next > pagination.totalPages) return
    setPage(next)
    setLoading(true)
  }

  const openRespond = (review) => {
    setRespondTarget(review)
    setResponse(review.response?.message || '')
  }

  const handleRespond = async (e) => {
    e.preventDefault()
    if (!response.trim()) {
      toast.error('Response message is required')
      return
    }
    setSaving(true)
    try {
      await respondToReview(respondTarget._id, { message: response.trim() })
      toast.success('Response published')
      setRespondTarget(null)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openModerate = (review) => {
    setModerateTarget(review)
    setModerateForm({
      status: review.status === 'FLAGGED' ? 'PUBLISHED' : 'HIDDEN',
      reason: review.moderation?.reason || '',
    })
  }

  const handleModerate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await moderateReview(moderateTarget._id, {
        status: moderateForm.status,
        reason: moderateForm.reason || undefined,
      })
      toast.success(`Review marked ${moderateForm.status.toLowerCase()}`)
      setModerateTarget(null)
      setLoading(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (review) => {
    setDetailLoading(true)
    setDetail(review)
    try {
      const res = await getReview(review._id)
      setDetail(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare size={22} style={{ color: ACCENT }} />
            <h1
              className="text-3xl font-black uppercase tracking-widest"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Reviews
            </h1>
          </div>
          <p className="text-sm" style={{ color: MUTED }}>
            Moderate customer feedback and publish workshop responses
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => { setStatus(f); setPage(1); setLoading(true) }}
              className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 cursor-pointer"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                letterSpacing: '0.1em',
                border: `1px solid ${status === f ? ACCENT : LINE_STRONG}`,
                color: status === f ? '#fff' : MUTED,
                background: status === f ? ACCENT : 'transparent',
              }}
            >
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        <div className="max-w-xs">
          <SelectInput
            label="Rating"
            value={rating}
            placeholder="All ratings"
            onChange={(e) => { setRating(e.target.value); setPage(1); setLoading(true) }}
          >
            {RATINGS.map((r) => (
              <option key={r} value={r} style={{ background: PANEL }}>
                {r} star{r > 1 ? 's' : ''}
              </option>
            ))}
          </SelectInput>
        </div>

        {loading ? (
          <Spinner />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={status === 'FLAGGED' ? 'Moderation queue is clear' : 'No reviews found'}
            message={status === 'FLAGGED' ? 'There are no flagged reviews waiting for review.' : 'Customer reviews will appear here once bookings are completed.'}
          />
        ) : (
          <div className="overflow-x-auto" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}>
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: `1px solid ${LINE_STRONG}` }}>
                  {['Customer', 'Vehicle', 'Workshop', 'Rating', 'Comment', 'Status', 'Created', 'Actions'].map((h) => (
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
                {reviews.map((r) => (
                  <tr
                    key={r._id}
                    className="transition-colors duration-150"
                    style={{ borderBottom: `1px solid ${LINE_STRONG}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = PANEL_ACTIVE }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <td className="px-5 py-3.5 text-sm" style={{ color: FOREGROUND }}>
                      {r.customerId?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {r.vehicleId?.registrationNumber || '—'}
                      <p className="text-xs">{r.vehicleId ? `${r.vehicleId.make || ''} ${r.vehicleId.model || ''}` : ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: MUTED }}>
                      {r.workshopId?.name || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5">
                        <RatingStars rating={r.rating} />
                        <span className="text-xs" style={{ color: MUTED }}>{r.rating}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm max-w-xs" style={{ color: MUTED }}>
                      {r.title && <span style={{ color: FOREGROUND }}>{r.title} — </span>}
                      {r.comment || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs whitespace-nowrap" style={{ color: MUTED }}>
                      {formatDateTime(r.createdAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(r)}
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
                          onClick={() => openRespond(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <Reply size={11} />
                          Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => openModerate(r)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
                          style={ghostButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = '#8a8580' }}
                        >
                          <ShieldCheck size={11} />
                          Moderate
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
        open={!!respondTarget}
        onClose={() => setRespondTarget(null)}
        title="Respond To Review"
        maxWidth="max-w-2xl"
      >
        {respondTarget && (
          <form onSubmit={handleRespond} className="space-y-4" noValidate>
            <div className="flex items-center gap-3 flex-wrap">
              <RatingStars rating={respondTarget.rating} size={14} />
              <span className="text-sm" style={{ color: MUTED }}>{respondTarget.customerId?.name}</span>
            </div>
            {respondTarget.comment && (
              <p className="text-sm p-3" style={{ color: MUTED, background: PANEL_ACTIVE, border: `1px solid ${LINE_STRONG}` }}>
                {respondTarget.comment}
              </p>
            )}
            <TextArea
              label="Public Response"
              required
              rows={5}
              maxLength={2000}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Thank the customer and address their feedback"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setRespondTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {saving ? 'Publishing...' : 'Publish Response'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!moderateTarget}
        onClose={() => setModerateTarget(null)}
        title="Moderate Review"
      >
        {moderateTarget && (
          <form onSubmit={handleModerate} className="space-y-4" noValidate>
            <SelectInput
              label="Moderation Status"
              required
              value={moderateForm.status}
              onChange={(e) => setModerateForm((s) => ({ ...s, status: e.target.value }))}
            >
              {MODERATION_STATUSES.map((s) => (
                <option key={s} value={s} style={{ background: PANEL }}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </SelectInput>
            <TextArea
              label="Moderation Reason"
              rows={3}
              maxLength={1000}
              value={moderateForm.reason}
              onChange={(e) => setModerateForm((s) => ({ ...s, reason: e.target.value }))}
              placeholder="Inappropriate language / spam"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModerateTarget(null)} className="px-5 py-3 text-xs font-black uppercase tracking-widest cursor-pointer" style={ghostButtonStyle}>
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-3 text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50" style={primaryButtonStyle}>
                {saving ? 'Saving...' : 'Apply Moderation'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title="Review"
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <Spinner />
        ) : detail ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={detail.status} />
              <RatingStars rating={detail.rating} size={15} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Customer', detail.customerId?.name],
                ['Vehicle', detail.vehicleId?.registrationNumber],
                ['Model', detail.vehicleId ? `${detail.vehicleId.make || ''} ${detail.vehicleId.model || ''}` : null],
                ['Workshop', detail.workshopId?.name],
                ['Submitted', formatDateTime(detail.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                    {label}
                  </span>
                  <span style={{ color: FOREGROUND }}>{value || '—'}</span>
                </div>
              ))}
            </div>

            {detail.title && (
              <p className="text-base font-bold" style={{ color: FOREGROUND }}>{detail.title}</p>
            )}
            <p className="text-sm" style={{ color: MUTED }}>{detail.comment || 'No comment provided.'}</p>

            {detail.images?.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {detail.images.map((img, idx) => (
                  <img
                    key={img.publicId || idx}
                    src={img.url}
                    alt="Review"
                    className="w-full h-24 object-cover"
                    style={{ border: `1px solid ${LINE_STRONG}` }}
                  />
                ))}
              </div>
            )}

            {detail.response?.message && (
              <div className="p-3" style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL_ACTIVE }}>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Workshop Response
                </p>
                <p className="text-sm" style={{ color: FOREGROUND }}>{detail.response.message}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {detail.response.respondedBy?.name} · {formatDateTime(detail.response.respondedAt)}
                </p>
              </div>
            )}

            {detail.moderation?.reason && (
              <div>
                <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: MUTED, fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Moderation
                </p>
                <p className="text-sm" style={{ color: FOREGROUND }}>{detail.moderation.reason}</p>
                <p className="text-xs mt-1" style={{ color: MUTED }}>
                  {detail.moderation.moderatedBy?.name || 'System'} · {formatDateTime(detail.moderation.moderatedAt)}
                </p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
