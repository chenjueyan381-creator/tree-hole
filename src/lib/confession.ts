export const CONFESSION_COLORS = [
  '#f97316', // 橙
  '#ec4899', // 粉
  '#8b5cf6', // 紫
  '#06b6d4', // 青
  '#22c55e', // 绿
  '#eab308', // 黄
  '#ef4444', // 红
  '#3b82f6', // 蓝
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

export function randomColor(): string {
  return CONFESSION_COLORS[Math.floor(Math.random() * CONFESSION_COLORS.length)]
}

export function randomTag(): string {
  return CONFESSION_TAGS[Math.floor(Math.random() * CONFESSION_TAGS.length)]
}

export interface Confession {
  id: string
  content: string
  color: string
  tag: string
  created_at: string
}
