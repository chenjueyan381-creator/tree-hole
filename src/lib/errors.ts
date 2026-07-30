import type { PostgrestError } from '@supabase/supabase-js'

/**
 * 把写入失败的原因翻译成看得懂的话。
 *
 * 之前这里统一显示"投递失败，请稍后再试"，等于把唯一的线索丢掉了 ——
 * 网络被拦截、RLS 拒绝、约束不匹配是完全不同的问题，修法也完全不同，
 * 必须让用户能直接看到是哪一种。
 */
export function describeWriteError(error: PostgrestError | null): string {
  if (!error) return '未知错误'

  const raw = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase()

  // 请求压根没到服务器：fetch 层就失败了，通常没有 Postgres 错误码
  if (
    !error.code &&
    (raw.includes('fetch') ||
      raw.includes('network') ||
      raw.includes('load failed') ||
      raw.includes('timeout'))
  ) {
    return '连不上数据库服务器（请求没发出去）。多半是网络拦截或超时 —— 换个网络试试。'
  }

  switch (error.code) {
    case '42501':
      return '数据库拒绝写入：RLS 策略不允许。请重新执行一遍 supabase/schema.sql。'
    case '23514':
      return '内容不符合数据库的取值约束（颜色或标签不在允许列表里）。这说明数据库里的 schema 不是最新版，请重新执行一遍 supabase/schema.sql。'
    case '23503':
      return '要回复的那条内容已经被删除了。'
    case '23505':
      return '重复写入。'
    default:
      return `${error.message || '写入失败'}${error.code ? `（错误码 ${error.code}）` : ''}`
  }
}
