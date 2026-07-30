/**
 * 管理员账号。
 *
 * 密码不在前端保存 —— 校验完全交给 Supabase Auth，前端只是把用户名拼成邮箱后
 * 调用 signInWithPassword。删除权限由数据库的 RLS 策略按下面这个邮箱判定，
 * 所以就算有人伪造前端状态，也删不掉任何东西。
 *
 * 这个邮箱必须和 supabase/schema.sql 里 RLS 策略中的邮箱完全一致。
 */
export const ADMIN_USERNAME = 'xiaojue'
const ADMIN_EMAIL_DOMAIN = 'treehole.app'

export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@${ADMIN_EMAIL_DOMAIN}`
}
