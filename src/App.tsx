import { useCallback, useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Confession } from './lib/confession'
import { ComposeBox } from './components/ComposeBox'
import { ConfessionCard } from './components/ConfessionCard'

const PAGE_SIZE = 100

function App() {
  const [confessions, setConfessions] = useState<Confession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const fetchConfessions = useCallback(async () => {
    const { data, error } = await supabase
      .from('confessions')
      .select('id, content, color, tag, created_at')
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)

    if (error) {
      setLoadError(true)
    } else {
      setLoadError(false)
      setConfessions(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchConfessions()

    const channel = supabase
      .channel('confessions-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'confessions' },
        (payload) => {
          const incoming = payload.new as Confession
          setConfessions((prev) =>
            prev.some((c) => c.id === incoming.id) ? prev : [incoming, ...prev],
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchConfessions])

  return (
    <div className="page">
      <div className="page-glow" aria-hidden="true" />

      <header className="page-header">
        <h1>树洞</h1>
        <p className="page-subtitle">写下无人回应的心事，像一封漂流瓶抛入夜色</p>
      </header>

      <main className="page-main">
        <ComposeBox onPosted={fetchConfessions} />

        <section className="feed">
          {loading && <p className="feed-status">正在打捞漂流瓶…</p>}
          {!loading && loadError && (
            <p className="feed-status feed-status--error">
              树洞暂时听不见了，请稍后刷新再试
            </p>
          )}
          {!loading && !loadError && confessions.length === 0 && (
            <p className="feed-status">这里还很安静，写下第一段心事吧</p>
          )}
          {!loading &&
            confessions.map((confession) => (
              <ConfessionCard key={confession.id} confession={confession} />
            ))}
        </section>
      </main>

      <footer className="page-footer">
        <p>完全匿名 · 无法编辑或删除 · 请勿留下可识别身份的信息</p>
      </footer>
    </div>
  )
}

export default App
