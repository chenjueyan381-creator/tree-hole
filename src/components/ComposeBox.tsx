import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { CONTENT_MAX_LENGTH, randomColor, randomTag } from '../lib/confession'
import { describeWriteError } from '../lib/errors'

interface ComposeBoxProps {
  onPosted?: () => void
}

export function ComposeBox({ onPosted }: ComposeBoxProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justPosted, setJustPosted] = useState(false)

  const trimmed = content.trim()
  const remaining = CONTENT_MAX_LENGTH - content.length
  const canSubmit = trimmed.length > 0 && remaining >= 0 && !submitting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    const { error: insertError } = await supabase.from('confessions').insert({
      content: trimmed,
      color: randomColor(),
      tag: randomTag(),
    })

    setSubmitting(false)

    if (insertError) {
      // 完整对象留给控制台，界面上给一句人话
      console.error('[树洞] 发布失败', insertError)
      setError(describeWriteError(insertError))
      return
    }

    setContent('')
    setJustPosted(true)
    onPosted?.()
    setTimeout(() => setJustPosted(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="compose">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写点什么…"
        maxLength={CONTENT_MAX_LENGTH + 50}
        rows={4}
        className="compose-textarea"
      />
      <div className="compose-footer">
        <span className={`compose-counter ${remaining < 0 ? 'compose-counter--over' : ''}`}>
          {remaining}
        </span>
        <div className="compose-actions">
          {justPosted && <span className="compose-success">已发布</span>}
          <button type="submit" disabled={!canSubmit} className="compose-submit">
            {submitting ? '发布中…' : '发布'}
          </button>
        </div>
      </div>
      {/* 错误单独占一行：原因可能很长，挤在按钮旁边会被截断 */}
      {error && <p className="compose-error">{error}</p>}
    </form>
  )
}
