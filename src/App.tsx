import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Confession } from './lib/confession'
import { useAdminSession } from './hooks/useAdminSession'
import { ComposeBox } from './components/ComposeBox'
import { ConfessionCard } from './components/ConfessionCard'
import { AdminLoginModal } from './components/AdminLoginModal'
import { PixelText } from './components/PixelText'
import { Xiaoke } from './components/Xiaoke'

const PAGE_SIZE = 100
const HEADLINE = '希望你天天开心'
const HEADLINE_CELL = 16

/**
 * 隐蔽入口：连点标题这么多次唤出登录框。
 *
 * 原来放在右下角，但那里在手机上很难点：iOS 的边缘手势区和 Safari 底部工具栏都在那，
 * 系统会把连点吃掉。标题面积大、离边缘远，好按得多，而且一样不显眼。
 */
const SECRET_CLICKS = 5
const SECRET_WINDOW = 5000

function App() {
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { isAdmin, signOut } = useAdminSession()

  const fetchConfessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('confessions')
      .select(
        'id, content, color, tag, created_at, replies(id, confession_id, content, created_at)',
      )
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: true, referencedTable: 'replies' })
      .limit(PAGE_SIZE)

    if (error) {
      setLoadError(true)
    } else {
      setLoadError(false)
      setConfessions((data ?? []) as Confession[])
    }
    setLoading(false)
  }, [])

  // Realtime：内容和回复的任何变动都重新拉一次列表。
  // 比在客户端手动合并 insert/delete 事件简单得多，也不容易出错。
  useEffect(() => {
    fetchConfessions()

    let timer: number | undefined
    const refetchSoon = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(fetchConfessions, 150)
    }

    const channel = supabase
      .channel('tree-hole-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'confessions' }, refetchSoon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'replies' }, refetchSoon)
      .subscribe()

    return () => {
      window.clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [fetchConfessions])

  // 标题按整数倍放大，非整数倍会让像素点变模糊
  const [headlineScale, setHeadlineScale] = useState(4)
  useEffect(() => {
    const intrinsic = HEADLINE.length * (HEADLINE_CELL + 2) - 2
    const calc = () => {
      const avail = Math.min(window.innerWidth - 32, 640)
      setHeadlineScale(Math.max(2, Math.min(4, Math.floor(avail / intrinsic))))
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  const clicks = useRef<number[]>([])
  const handleSecretClick = () => {
    const now = Date.now()
    clicks.current = [...clicks.current, now].filter((t) => now - t < SECRET_WINDOW)
    if (clicks.current.length >= SECRET_CLICKS) {
      clicks.current = []
      if (!isAdmin) setShowLogin(true)
    }
  }

  // 备用入口：网址带 #admin 直接弹登录框。
  // 连点手势在不同设备上总有意外，这条路不依赖任何触摸行为，一定能进。
  // 入口好不好找不影响安全：密码校验在 Supabase Auth，删除权限由 RLS 判定。
  useEffect(() => {
    const check = () => {
      if (window.location.hash.toLowerCase() === '#admin' && !isAdmin) {
        setShowLogin(true)
      }
    }
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [isAdmin])

  return (
    <div className="page">
      <Xiaoke />

      {isAdmin && (
        <div className="admin-bar">
          <span className="admin-bar-text">管理员模式</span>
          <button type="button" onClick={signOut} className="px-btn px-btn--ghost px-btn--sm">
            退出
          </button>
        </div>
      )}

      <header className="page-header">
        {/* 标题本身就是隐蔽的管理入口，连点 5 次。
            必须用 button 而不是 div：iOS Safari 对非交互元素的 click 冒泡有历史遗留
            问题，普通 div 上的连点可能根本不触发。button 是原生可点元素，不受影响。 */}
        <button
          type="button"
          className="headline-hit"
          onClick={handleSecretClick}
          tabIndex={-1}
          aria-hidden="true"
        >
          <PixelText
            text={HEADLINE}
            cell={HEADLINE_CELL}
            scale={headlineScale}
            color="#3d3226"
            className="headline"
          />
        </button>
        <p className="page-subtitle">匿名树洞 · 说给树听</p>
      </header>

      <main className="page-main">
        <ComposeBox onPosted={fetchConfessions} />

        <section className="feed">
          {loading && <p className="feed-status">加载中…</p>}
          {!loading && loadError && (
            <p className="feed-status feed-status--error">加载失败，请刷新重试</p>
          )}
          {!loading && !loadError && confessions.length === 0 && (
            <p className="feed-status">还没有人留言</p>
          )}
          {!loading &&
            confessions.map((confession) => (
              <ConfessionCard
                key={confession.id}
                confession={confession}
                isAdmin={isAdmin}
                onChanged={fetchConfessions}
              />
            ))}
        </section>
      </main>

      <footer className="page-footer">
        <p>内容匿名发布，无法编辑</p>
      </footer>

      {showLogin && (
        <AdminLoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
    </div>
  )
}

export default App
