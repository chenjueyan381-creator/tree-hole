import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ADMIN_USERNAME, usernameToEmail } from '../lib/admin'

/**
 * 跟踪管理员登录状态。
 *
 * 这里的 isAdmin 只用来决定"要不要显示删除按钮"这种界面问题。
 * 真正的权限判定在数据库的 RLS 策略里，前端即使被改也删不动数据。
 */
export function useAdminSession() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (active) setEmail(data.session?.user.email ?? null)
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? null)
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return {
    isAdmin: email === usernameToEmail(ADMIN_USERNAME),
    signOut: () => supabase.auth.signOut(),
  }
}
