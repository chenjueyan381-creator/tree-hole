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

  /**
   * RLS 拒绝删除时不会报错，只是「删掉了 0 行」——不带 select() 的话前端完全看不出
   * 区别，会以为删成功了，刷新后内容还在。所以这里用 select() 拿回被删的行来核对。
   * 最常见的触发原因：登录的账号和 schema.sql 里 RLS 策略写的邮箱对不上。
   */
  async function deleteRow(table: 'confessions' | 'replies', id: string) {
    const { data, error } = await supabase.from(table).delete().eq('id', id).select('id')

    if (error) {
      window.alert('删除失败：' + error.message)
      return false
    }
    if (!data || data.length === 0) {
      window.alert(
        '删除没有生效。\n\n' +
          '数据库拒绝了这次删除，通常是当前登录的账号和 schema.sql 里 RLS 策略中的管理员邮箱不一致。\n' +
          '解决办法：重新执行一遍 supabase/schema.sql。',
      )
      return false
    }
    return true
  }

  async function deleteConfession() {
    if (!window.confirm('删除这条内容？它下面的回复也会一起删掉，且无法恢复。')) return
    setBusy(true)
    const ok = await deleteRow('confessions', confession.id)
    setBusy(false)
    if (ok) onChanged()
  }

  async function deleteReply(replyId: string) {
    if (!window.confirm('删除这条回复？')) return
    if (await deleteRow('replies', replyId)) onChanged()
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
