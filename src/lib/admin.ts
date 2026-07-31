/**
 * 管理员账号。
 *
 * 密码不在前端保存 —— 校验完全交给 Supabase Auth，前端只是把输入拼成邮箱后
 * 调用 signInWithPassword。删除权限由数据库的 RLS 策略按下面这个邮箱判定，
 * 所以就算有人伪造前端状态，也删不掉任何东西。
 *
 * ⚠️ 改这里的话，supabase/schema.sql 里两条删除策略的邮箱也必须同步改，
 * 并且要重新执行一遍那个 SQL。两边不一致时，删除会「没有报错但也删不掉」——
 * 因为 RLS 拒绝时返回的是"删除了 0 行"，而不是错误。
 */
export const ADMIN_EMAIL = 'xiaojue2026@gmail.com'

/**
 * 登录框里填完整邮箱或只填用户名都认：
 * 带 @ 就当成邮箱直接用，不带就自动补上管理员邮箱的域名。
 */
export function toLoginEmail(input: string): string {
  const value = input.trim().toLowerCase()
  if (!value || value.includes('@')) return value

  const domain = ADMIN_EMAIL.split('@')[1]
  return `${value}@${domain}`
}
