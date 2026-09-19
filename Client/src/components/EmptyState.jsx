import { Inbox } from 'lucide-react'
import { FAINT, FOREGROUND, LINE_STRONG, PANEL } from '../config/theme'

export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      style={{ border: `1px solid ${LINE_STRONG}`, background: PANEL }}
    >
      <div
        className="flex items-center justify-center w-14 h-14 mb-4"
        style={{ background: 'rgba(217,79,61,0.08)' }}
      >
        <Icon size={26} style={{ color: FAINT }} />
      </div>
      <p
        className="text-lg font-black uppercase tracking-widest"
        style={{ fontFamily: "'Barlow Condensed', sans-serif", color: FOREGROUND }}
      >
        {title}
      </p>
      {message && (
        <p className="text-sm mt-1.5 max-w-md font-light" style={{ color: FAINT }}>
          {message}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}