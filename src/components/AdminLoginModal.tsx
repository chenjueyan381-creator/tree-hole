import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { toLoginEmail } from '../lib/admin'

interface AdminLoginModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password || submitting) return

    setSubmitting(true)
    setError(null)

    // 密码校验完全在 Supabase Auth 侧完成，前端不保存任何凭据
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: toLoginEmail(username),
      password,
    })

    setSubmitting(false)

    if (signInError) {
      setError('用户名或密码不正确')
      return
    }

    onSuccess()
  }

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="管理员登录"
      >
        <h2 className="modal-title">ADMIN</h2>

        <form onSubmit={handleSubmit} className="modal-form">
          <label className="field">
            <span className="field-label">用户名 / 邮箱</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              className="px-input"
            />
          </label>

          <label className="field">
            <span className="field-label">密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="px-input"
            />
          </label>

          {error && <p className="px-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="px-btn px-btn--ghost">
              取消
            </button>
            <button type="submit" disabled={submitting} className="px-btn">
              {submitting ? '登录中' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
