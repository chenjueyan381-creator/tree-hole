import { useEffect, useRef } from 'react'

interface PixelTextProps {
  text: string
  /** 内部点阵高度，越小越"像素"。经典点阵字库是 16。 */
  cell?: number
  /** 每个内部像素放大成多少个 CSS 像素。 */
  scale?: number
  color?: string
  className?: string
}

/**
 * 把中文渲染成真正的点阵像素字。
 *
 * Press Start 2P、Silkscreen 这类像素字体都只有拉丁字形，中文会直接回退成系统字体，
 * 像素感全无；而中文像素字体（Zpix / 缝合像素）既不在 Google Fonts 也不在 npm 上。
 * 所以这里换个思路：用系统中文字体把文字画到一张很小的 canvas 上，
 * 再把每个像素的 alpha 二值化（去掉抗锯齿的灰边），最后用 image-rendering: pixelated 放大。
 * 得到的就是硬边的点阵字，且对任意文字都适用。
 */
export function PixelText({
  text,
  cell = 16,
  scale = 4,
  color = '#3d3226',
  className,
}: PixelTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const chars = [...text]
    const gap = 2
    const width = chars.length * (cell + gap) - gap
    // 留一点上下余量，避免笔画被裁掉
    const height = cell + 4

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#000'
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = `bold ${cell}px "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", "Source Han Sans SC", sans-serif`

    // 逐字画在固定宽度的格子里：间距均匀，而且每个字都对齐到像素网格
    chars.forEach((char, i) => {
      const cx = Math.round(i * (cell + gap) + cell / 2)
      ctx.fillText(char, cx, Math.round(height / 2))
    })

    // 二值化：alpha 过半的算实心点，其余全透明，这样就没有抗锯齿的灰边了
    const image = ctx.getImageData(0, 0, width, height)
    const data = image.data
    const [r, g, b] = hexToRgb(color)
    for (let i = 0; i < data.length; i += 4) {
      const solid = data[i + 3] >= 128
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = solid ? 255 : 0
    }
    ctx.putImageData(image, 0, 0)

    canvas.style.width = `${width * scale}px`
    canvas.style.height = `${height * scale}px`
  }, [text, cell, scale, color])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={text}
      style={{ imageRendering: 'pixelated', display: 'block', maxWidth: '100%' }}
    />
  )
}

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '')
  const full =
    v.length === 3
      ? v
          .split('')
          .map((c) => c + c)
          .join('')
      : v
  const n = Number.parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
