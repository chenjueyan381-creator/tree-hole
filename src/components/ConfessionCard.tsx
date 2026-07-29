import type { Confession } from '../lib/confession'
import { relativeTime } from '../lib/time'

interface ConfessionCardProps {
  confession: Confession
}

export function ConfessionCard({ confession }: ConfessionCardProps) {
  return (
    <article
      className="confession-card"
      style={{ '--accent': confession.color } as React.CSSProperties}
    >
      <div className="confession-card-header">
        <span className="confession-tag" style={{ color: confession.color }}>
          {confession.tag}
        </span>
        <span className="confession-time">{relativeTime(confession.created_at)}</span>
      </div>
      <p className="confession-content">{confession.content}</p>
    </article>
  )
}
