import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { REPLY_MAX_LENGTH } from '../lib/confession'
import { describeWriteError } from '../lib/errors'

interface ReplyFormProps {
  confessionId: string
  onPosted: () => void
  onCancel: () => void
}

export function ReplyForm({ confessionId, onPosted, onCancel }: ReplyFormProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmed = content.trim()
  const remaining = REPLY_MAX_LENGTH - content.length
  const canSubmit = trimmed.length > 0 && remaining >= 0 && !submitting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('replies')
      .insert({ confession_id: confessionId, content: trimmed })

    setSubmitting(false)

    if (insertError) {
      console.error('[树洞] 回复失败', insertError)
      setError(describeWriteError(insertError))
      return
    }

    setContent('')
    onPosted()
  }

  return (
    <form onSubmit={handleSubmit} className="reply-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="匿名回复…"
        maxLength={REPLY_MAX_LENGTH + 50}
        rows={2}
        autoFocus
        className="reply-textarea"
      />
      <div className="reply-form-footer">
        <span className={`px-count ${remaining < 0 ? 'px-count--over' : ''}`}>{remaining}</span>
        <div className="reply-form-actions">
          {error && <span className="px-error">{error}</span>}
          <button type="button" onClick={onCancel} className="px-btn px-btn--ghost">
            取消
          </button>
          <button type="submit" disabled={!canSubmit} className="px-btn">
            {submitting ? '发送中' : '回复'}
          </button>
        </div>
      </div>
    </form>
  )
}
