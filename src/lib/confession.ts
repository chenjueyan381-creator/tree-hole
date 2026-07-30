// 暖色调配色，配合奶油色背景。改动这里时记得同步 supabase/schema.sql 的 CHECK 约束。
export const CONFESSION_COLORS = [
  '#e8643c', // 砖红
  '#f0977a', // 藕粉（和小克同色）
  '#e0a32e', // 琥珀
  '#7fa650', // 橄榄绿
  '#3f9e8c', // 松绿
  '#4a7fb5', // 灰蓝
  '#8b6bb0', // 紫
  '#d4568c', // 洋红
] as const

export const CONFESSION_TAGS = [
  '随笔',
  '深夜',
  '路过',
  '小事',
  '碎碎念',
  '随手记',
  '心情',
  '无题',
] as const

export const CONTENT_MAX_LENGTH = 500
export const REPLY_MAX_LENGTH = 300

const COLOR_SET: ReadonlySet<string> = new Set(CONFESSION_COLORS)

export function randomColor(): string {
  return CONFESSION_COLORS[Math.floor(Math.random() * CONFESSION_COLORS.length)]
}

export function randomTag(): string {
  return CONFESSION_TAGS[Math.floor(Math.random() * CONFESSION_TAGS.length)]
}

/**
 * 颜色最终会进到 CSS 自定义属性里，所以渲染前收窄到已知取值，
 * 避免数据库里出现意外内容时影响页面样式。
 */
export function safeColor(color: string): string {
  return COLOR_SET.has(color) ? color : CONFESSION_COLORS[1]
}

export interface Reply {
  id: string
  confession_id: string
  content: string
  created_at: string
}

export interface Confession {
  id: string
  content: string
  color: string
  tag: string
  created_at: string
  replies: Reply[]
}
