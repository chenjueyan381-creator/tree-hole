import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 自托管像素字体：Google Fonts 在中国大陆无法访问，用 <link> 会直接加载失败，
// 打进产物里由 Vercel 一起分发更稳。只取 latin 子集，这两个字体本来也没有中文字形。
import '@fontsource/press-start-2p/latin-400.css'
import '@fontsource/silkscreen/latin-400.css'
import '@fontsource/silkscreen/latin-700.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
