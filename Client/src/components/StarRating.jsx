import { Star } from 'lucide-react'
import { ACCENT } from '../config/theme'

export default function StarRating({ count }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={14} style={{ color: ACCENT }} fill={ACCENT} />
      ))}
    </div>
  )
}