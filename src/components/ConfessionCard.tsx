import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { safeColor, type Confession } from '../lib/confession'
import { relativeTime } from '../lib/time'
import { ReplyForm } from './ReplyForm'

interface ConfessionCardProps {
  confession: Confession
  isAdmin: boolean
  onChanged: () => void
}

export function ConfessionCard({ confession, isAdmin, onChanged }: ConfessionCardProps) {
  const [replying, setReplying] = useState(false)
  const [busy, setBusy] = useState(false)
  const color = safeColor(confession.color)
  const replies = confession.replies ?? []

  async function deleteConfession() {
    if (!window.confirm('删除这条内容？它下面的回复也会一起删掉，且无法恢复。')) return
    setBusy(true)
    const { error } = await supabase.from('confessions').delete().eq('id', confession.id)
    setBusy(false)
    if (error) {
      window.alert('删除失败：' + error.message)
      return
    }
    onChanged()
  }

  async function deleteReply(replyId: string) {
    if (!window.confirm('删除这条回复？')) return
    const { error } = await supabase.from('replies').delete().eq('id', replyId)
    if (error) {
      window.alert('删除失败：' + error.message)
      return
    }
    onChanged()
  }

  return (
    <article className="card" style={{ '--accent': color } as React.CSSProperties}>
      <div className="card-head">
        <span className="card-tag">{confession.tag}</span>
        <div className="card-head-right">
          <span className="card-time">{relativeTime(confession.created_at)}</span>
          {isAdmin && (
            <button
              type="button"
              onClick={deleteConfession}
              disabled={busy}
              className="px-btn px-btn--danger px-btn--sm"
              title="删除这条内容"
            >
              删除
            </button>
          )}
        </div>
      </div>

      <p className="card-body">{confession.content}</p>

      {replies.length > 0 && (
        <ul className="reply-list">
          {replies.map((reply) => (
            <li key={reply.id} className="reply">
              <p className="reply-body">{reply.content}</p>
              <div className="reply-meta">
                <span className="card-time">{relativeTime(reply.created_at)}</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => deleteReply(reply.id)}
                    className="px-btn px-btn--danger px-btn--sm"
                    title="删除这条回复"
                  >
                    删除
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {replying ? (
        <ReplyForm
          confessionId={confession.id}
          onPosted={() => {
            setReplying(false)
            onChanged()
          }}
          onCancel={() => setReplying(false)}
        />
      ) : (
        <button type="button" onClick={() => setReplying(true)} className="px-btn px-btn--ghost px-btn--sm">
          回复{replies.length > 0 ? ` (${replies.length})` : ''}
        </button>
      )}
    </article>
  )
}
