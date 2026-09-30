import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Star,
  MessageSquare,
  Send,
  Quote,
  Camera,
  Plus,
  X,
} from 'lucide-react'
import AppNav from '../../components/AppNav'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import Spinner from '../../components/Spinner'
import Modal from '../../components/Modal'
import { SelectInput, TextArea, TextInput } from '../../components/Field'
import { listMyBookings } from '../../services/bookingApi'
import {
  listMyReviews,
  listPublishedReviews,
  createReview,
  addReviewImage,
  removeReviewImage,
} from '../../services/reviewApi'
import { formatDate } from '../../utils/transitions'
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

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']
const MAX_REVIEW_IMAGES = 5
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function StarRow({ rating, size = 13, onSelect }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={size}
          onClick={onSelect ? () => onSelect(value) : undefined}
          style={{
            color: value <= rating ? '#f59e0b' : LINE_STRONG,
            cursor: onSelect ? 'pointer' : 'default',
            transition: 'color 0.2s ease',
          }}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review, highlight, onRemoveImage, removingImageId }) {
  const images = review.images || []

  return (
    <div
      className="px-5 py-4"
      style={{
        border: `1px solid ${highlight ? ACCENT : LINE_STRONG}`,
        background: highlight ? PANEL_ACTIVE : PANEL,
      }}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <StarRow rating={review.rating} />
            <span className="text-[11px] uppercase tracking-widest" style={{ color: MUTED }}>
              {RATING_LABELS[review.rating]}
            </span>
            {review.status && review.status !== 'PUBLISHED' && (
              <StatusBadge status={review.status} />
            )}
          </div>
          {review.title && (
            <p className="text-sm font-semibold mt-2" style={{ color: FOREGROUND }}>{review.title}</p>
          )}
          {review.comment && (
            <p className="text-sm mt-1.5 whitespace-pre-line" style={{ color: MUTED }}>{review.comment}</p>
          )}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-3">
              {images.map((img, idx) => (
                <div key={img.publicId || img.url || idx} className="relative">
                  <img
                    src={img.url}
                    alt="Review photo"
                    className="w-24 h-20 object-cover"
                    style={{
                      border: `1px solid ${LINE_STRONG}`,
                      opacity: removingImageId && removingImageId === img.publicId ? 0.35 : 1,
                    }}
                  />
                  {onRemoveImage && (
                    <button
                      type="button"
                      onClick={() => onRemoveImage(review, img)}
                      disabled={removingImageId === img.publicId}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
                      style={{ background: ACCENT, color: '#fff', border: `2px solid ${PANEL}` }}
                      title="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs mt-2.5" style={{ color: MUTED }}>
            {review.customerId?.name || 'Customer'} ·{' '}
            {review.vehicleId
              ? `${review.vehicleId.registrationNumber || ''} ${review.vehicleId.make || ''} ${review.vehicleId.model || ''}`.trim()
              : 'Vehicle'}{' '}
            · {review.workshopId?.name || 'Workshop'} · {formatDate(review.createdAt)}
          </p>
          {review.response?.message && (
            <div
              className="mt-3 px-3 py-2.5"
              style={{ border: `1px solid ${LINE_STRONG}`, background: '#0e0e0e' }}
            >
              <p
                className="text-[10px] font-black uppercase tracking-widest mb-1"
                style={{ color: ACCENT, fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Response from {review.response.respondedBy?.name || review.workshopId?.name || 'the workshop'}
              </p>
              <p className="text-sm" style={{ color: MUTED }}>{review.response.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [myReviews, setMyReviews] = useState([])
  const [published, setPublished] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [form, setForm] = useState({ bookingId: '', rating: 5, title: '', comment: '' })
  const [newImages, setNewImages] = useState([])
  const [removingImageId, setRemovingImageId] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listMyBookings({ limit: 100 }),
      listMyReviews({ limit: 50 }),
      listPublishedReviews({ limit: 20, sortBy: 'createdAt', sortOrder: 'desc' }),
    ])
      .then(([bookingRes, mineRes, publishedRes]) => {
        if (cancelled) return
        setBookings(bookingRes.data?.bookings || [])
        setMyReviews(mineRes.data?.reviews || [])
        setPublished(publishedRes.data?.reviews || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reviewedBookingIds = useMemo(
    () => new Set(myReviews.map((review) => review.bookingId?._id || review.bookingId)),
    [myReviews],
  )

  const reviewableBookings = useMemo(
    () => bookings.filter((b) => b.status === 'COMPLETED' && !reviewedBookingIds.has(b._id)),
    [bookings, reviewedBookingIds],
  )

  const openModal = () => {
    if (reviewableBookings.length === 0) {
      toast.error('You have no completed bookings awaiting a review')
      return
    }
    setForm({ bookingId: reviewableBookings[0]._id, rating: 5, title: '', comment: '' })
    setNewImages([])
    setFormError('')
    setModalOpen(true)
  }

  const addPhotos = (e) => {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''

    const images = picked.filter((f) => f.type.startsWith('image/'))
    if (images.length < picked.length) {
      toast.error('Only image files can be attached')
    }

    const tooLarge = images.filter((f) => f.size > MAX_IMAGE_BYTES)
    if (tooLarge.length > 0) {
      toast.error('Each photo must be 10 MB or smaller')
    }

    const accepted = images.filter((f) => f.size <= MAX_IMAGE_BYTES)
    setNewImages((prev) => {
      const next = [...prev, ...accepted]
      if (next.length > MAX_REVIEW_IMAGES) {
        toast.error(`You can attach at most ${MAX_REVIEW_IMAGES} photos`)
      }
      return next.slice(0, MAX_REVIEW_IMAGES)
    })
  }

  const removeNewPhoto = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveImage = async (review, image) => {
    if (!image.publicId) {
      toast.error('This photo cannot be removed')
      return
    }
    setRemovingImageId(image.publicId)
    try {
      await removeReviewImage(review._id, image.publicId)
      setMyReviews((items) =>
        items.map((item) =>
          item._id === review._id
            ? { ...item, images: (item.images || []).filter((img) => img.publicId !== image.publicId) }
            : item,
        ),
      )
      setPublished((items) =>
        items.map((item) =>
          item._id === review._id
            ? { ...item, images: (item.images || []).filter((img) => img.publicId !== image.publicId) }
            : item,
        ),
      )
      toast.success('Photo removed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRemovingImageId(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.bookingId) {
      setFormError('Select the booking you want to review')
      return
    }
    if (!form.comment.trim()) {
      setFormError('Add a short comment about the service')
      return
    }
    setSaving(true)
    setFormError('')
    try {
      const createRes = await createReview({
        bookingId: form.bookingId,
        rating: Number(form.rating),
        title: form.title.trim() || undefined,
        comment: form.comment.trim(),
      })

      const created = createRes.data
      let failedUploads = 0

      for (const file of newImages) {
        try {
          await addReviewImage(created._id, file)
        } catch {
          failedUploads += 1
        }
      }

      if (failedUploads > 0) {
        toast.error(`Review posted, but ${failedUploads} photo(s) failed to upload`)
      } else {
        toast.success('Thanks for your review!')
      }

      setModalOpen(false)
      setForm({ bookingId: '', rating: 5, title: '', comment: '' })
      setNewImages([])
      const [mineRes, publishedRes] = await Promise.all([
        listMyReviews({ limit: 50 }),
        listPublishedReviews({ limit: 20 }),
      ])
      setMyReviews(mineRes.data?.reviews || [])
      setPublished(publishedRes.data?.reviews || [])
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const selectedBooking = bookings.find((b) => b._id === form.bookingId)

  return (
    <div className="min-h-screen" style={{ background: BACKGROUND, color: FOREGROUND }}>
      <AppNav />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer"
          style={{ color: MUTED, background: 'transparent', border: 'none', fontFamily: "'Barlow Condensed', sans-serif" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Star size={22} style={{ color: ACCENT }} />
              <h1
                className="text-3xl font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                My Reviews
              </h1>
            </div>
            <p className="text-sm" style={{ color: MUTED }}>
              Rate your completed services and see what other customers say
            </p>
          </div>
          <button
            type="button"
            onClick={openModal}
            disabled={loading || reviewableBookings.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
            style={primaryButtonStyle}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
            onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
          >
            <MessageSquare size={14} />
            Write a Review
          </button>
        </div>

        {error && (
          <div
            className="px-4 py-3 text-sm"
            style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <Spinner label="Loading reviews..." />
        ) : (
          <>
            <section className="space-y-3">
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Reviews by you
              </h2>
              {myReviews.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="You have not reviewed anything yet"
                  message="Once a booking is marked complete you can rate the workshop and share your experience."
                />
              ) : (
                <div className="space-y-3">
                  {myReviews.map((review) => (
                    <ReviewCard
                      key={review._id}
                      review={review}
                      highlight
                      onRemoveImage={handleRemoveImage}
                      removingImageId={removingImageId}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2
                className="text-base font-black uppercase tracking-widest"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '0.1em' }}
              >
                Recent customer reviews
              </h2>
              {published.length === 0 ? (
                <EmptyState
                  icon={Quote}
                  title="No published reviews"
                  message="Published reviews from the KROM DETAIL community will show up here."
                />
              ) : (
                <div className="space-y-3">
                  {published.map((review) => (
                    <ReviewCard key={review._id} review={review} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Write a Review">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <SelectInput
            label="Booking"
            required
            value={form.bookingId}
            onChange={(e) => setForm((s) => ({ ...s, bookingId: e.target.value }))}
          >
            {reviewableBookings.map((booking) => (
              <option key={booking._id} value={booking._id} style={{ background: PANEL }}>
                {booking.bookingNumber} — {booking.workshopId?.name || 'Workshop'} ·{' '}
                {booking.vehicleId ? `${booking.vehicleId.make} ${booking.vehicleId.model}` : 'Vehicle'}
              </option>
            ))}
          </SelectInput>

          {selectedBooking && (
            <p className="text-xs" style={{ color: MUTED }}>
              Completed {formatDate(selectedBooking.completedAt || selectedBooking.updatedAt)} ·{' '}
              {selectedBooking.workshopId?.name}
            </p>
          )}

          <div>
            <p
              className="block text-xs uppercase tracking-widest mb-1.5"
              style={{ color: '#8a8580', letterSpacing: '0.14em' }}
            >
              Rating <span style={{ color: ACCENT }}>*</span>
            </p>
            <div className="flex items-center gap-4">
              <StarRow rating={form.rating} size={26} onSelect={(value) => setForm((s) => ({ ...s, rating: value }))} />
              <span className="text-xs uppercase tracking-widest" style={{ color: MUTED }}>
                {RATING_LABELS[form.rating]}
              </span>
            </div>
          </div>

          <TextInput
            label="Title"
            value={form.title}
            maxLength={150}
            onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            placeholder="Sum it up in a few words"
          />

          <TextArea
            label="Comment"
            required
            rows={4}
            maxLength={3000}
            value={form.comment}
            onChange={(e) => setForm((s) => ({ ...s, comment: e.target.value }))}
            placeholder="How was the detailing work, the handover and the overall experience?"
          />

          <div>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <Camera size={15} style={{ color: ACCENT }} />
                <span
                  className="block text-xs uppercase tracking-widest"
                  style={{ color: '#8a8580', letterSpacing: '0.14em' }}
                >
                  Photos
                </span>
              </div>
              <label
                className="inline-flex items-center gap-1.5 px-3 py-2 text-[11px] font-black uppercase tracking-widest transition-all duration-200 cursor-pointer"
                style={{
                  ...ghostButtonStyle,
                  opacity: newImages.length >= MAX_REVIEW_IMAGES ? 0.5 : 1,
                  cursor: newImages.length >= MAX_REVIEW_IMAGES ? 'not-allowed' : 'pointer',
                }}
              >
                <Plus size={12} />
                Add Photo
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={newImages.length >= MAX_REVIEW_IMAGES}
                  className="hidden"
                  onChange={addPhotos}
                />
              </label>
            </div>

            {newImages.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {newImages.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-24 h-20 object-cover"
                      style={{ border: `1px solid ${ACCENT}` }}
                    />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center cursor-pointer"
                      style={{ background: ACCENT, color: '#fff', border: `2px solid ${PANEL}` }}
                      title="Remove photo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs" style={{ color: MUTED }}>
                Optional — attach up to {MAX_REVIEW_IMAGES} photos of the finished work.
              </p>
            )}
          </div>

          {formError && (
            <div
              className="px-3 py-2.5 text-sm"
              style={{ border: '1px solid #7f2a24', background: 'rgba(248,113,113,0.08)', color: '#f87171' }}
            >
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-3 text-xs font-black uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              style={ghostButtonStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE_STRONG; e.currentTarget.style.color = MUTED }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={primaryButtonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.background = ACCENT)}
            >
              <Send size={13} />
              {saving ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
