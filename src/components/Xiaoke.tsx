import { useEffect, useRef } from 'react'

const BODY = '#f0977a'
const EYE = '#4a2f26'

// 精灵按 18x10 的像素网格摆放，对照参考图量出来的比例
const SPRITE_W = 18
const SPRITE_H = 10
const SCALE = 5

const WALK_SPEED = 46 // px/s
const STEP_INTERVAL = 200 // 换腿帧的间隔(ms)

/** 走路两帧：交替把前后腿收短，做出迈步的感觉 */
const LEGS_A = [
  { x: 4, h: 2 },
  { x: 6, h: 1 },
  { x: 11, h: 2 },
  { x: 13, h: 1 },
]
const LEGS_B = [
  { x: 4, h: 1 },
  { x: 6, h: 2 },
  { x: 11, h: 1 },
  { x: 13, h: 2 },
]

function Legs({ legs }: { legs: typeof LEGS_A }) {
  return (
    <>
      {legs.map((leg) => (
        <rect key={leg.x} x={leg.x} y={8} width={1} height={leg.h} fill={BODY} />
      ))}
    </>
  )
}

/**
 * 小克：一只在页面上自己溜达的像素小猪。
 *
 * 位置直接写进 DOM 的 transform，不走 React state —— 否则每帧都要重渲染整个页面。
 * 整体 pointer-events: none，保证它永远不会挡住下面的按钮和输入框。
 */
export function Xiaoke() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const spriteW = SPRITE_W * SCALE
    const spriteH = SPRITE_H * SCALE
    const maxX = () => Math.max(0, window.innerWidth - spriteW)
    const maxY = () => Math.max(0, window.innerHeight - spriteH)

    let x = Math.random() * maxX()
    let y = maxY() * (0.5 + Math.random() * 0.45)
    let targetX = x
    let targetY = y
    let facing = 1
    let pauseUntil = 0
    let lastStep = 0
    let stepFlag = false
    let raf = 0

    const draw = () => {
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) scaleX(${facing})`
    }

    // 静止时就安安静静待在角落，不做动画
    if (reduced) {
      x = maxX() * 0.5
      y = maxY() * 0.9
      draw()
      return
    }

    const pickTarget = () => {
      targetX = Math.random() * maxX()
      // 偏向页面下半部分游走，少挡内容
      targetY = maxY() * (0.35 + Math.random() * 0.6)
    }
    pickTarget()

    let prev = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - prev) / 1000, 0.05) // 切标签页回来时别瞬移
      prev = now

      if (now >= pauseUntil) {
        const dx = targetX - x
        const dy = targetY - y
        const dist = Math.hypot(dx, dy)

        if (dist < 2) {
          // 到了，歇一会儿再换目标
          pauseUntil = now + 400 + Math.random() * 1800
          pickTarget()
        } else {
          const move = Math.min(WALK_SPEED * dt, dist)
          x += (dx / dist) * move
          y += (dy / dist) * move
          if (Math.abs(dx) > 1) facing = dx < 0 ? -1 : 1

          if (now - lastStep > STEP_INTERVAL) {
            lastStep = now
            stepFlag = !stepFlag
            el.classList.toggle('xiaoke--step', stepFlag)
          }
        }
      }

      // 窗口变小后可能跑到视口外，夹回来
      x = Math.min(x, maxX())
      y = Math.min(y, maxY())

      draw()
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const onResize = () => {
      targetX = Math.min(targetX, maxX())
      targetY = Math.min(targetY, maxY())
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div ref={ref} className="xiaoke" aria-hidden="true">
      <svg
        width={SPRITE_W * SCALE}
        height={SPRITE_H * SCALE}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        shapeRendering="crispEdges"
      >
        {/* 身体 */}
        <rect x={3} y={1} width={12} height={7} fill={BODY} />
        {/* 尾巴 / 鼻子 */}
        <rect x={1} y={4} width={2} height={2} fill={BODY} />
        <rect x={15} y={4} width={2} height={2} fill={BODY} />
        {/* 眼睛 */}
        <rect x={5} y={3} width={1} height={3} fill={EYE} />
        <rect x={11} y={3} width={1} height={3} fill={EYE} />
        {/* 腿：两帧交替 */}
        <g className="xiaoke-legs-a">
          <Legs legs={LEGS_A} />
        </g>
        <g className="xiaoke-legs-b">
          <Legs legs={LEGS_B} />
        </g>
      </svg>
    </div>
  )
}
