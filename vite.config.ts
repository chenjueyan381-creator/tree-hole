import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages 的项目站点跑在 https://<用户名>.github.io/<仓库名>/ 这样的子路径下，
 * 所以打包时资源引用要带上 /<仓库名>/ 前缀，否则 JS/CSS 全部 404。
 *
 * 但 Vercel 是跑在根路径的，两边不能用同一个 base。所以只在 GitHub Actions 里
 * （由 workflow 设置 GITHUB_PAGES=true）才加前缀，其他情况一律用根路径，
 * 这样现有的 Vercel 部署完全不受影响。
 *
 * 仓库名从 GITHUB_REPOSITORY 里取（Actions 自动注入 "owner/repo"），
 * 这样以后仓库改名也不用回来改配置。
 */
function resolveBase(): string {
  if (process.env.GITHUB_PAGES !== 'true') return '/'
  const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
  return repo ? `/${repo}/` : '/'
}

// https://vite.dev/config/
export default defineConfig({
  base: resolveBase(),
  plugins: [react(), tailwindcss()],
})
