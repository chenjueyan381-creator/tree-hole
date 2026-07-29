# 树洞 · 匿名心事墙

React + Supabase 实现的匿名树洞：任何人无需登录即可发一段话，所有内容按时间倒序展示，
每条内容随机分配颜色和标签，无法回复、编辑或删除。暗色系、简约、带点神秘感。

## 1. 创建 Supabase 表结构

1. 打开你的 Supabase 项目 → 左侧 **SQL Editor**
2. 新建查询，粘贴 [`supabase/schema.sql`](./supabase/schema.sql) 的全部内容
3. 点击 Run

这会创建 `confessions` 表，并开启 Row Level Security：
- 任何人（含匿名访客）可以 `SELECT`（读取全部内容）和 `INSERT`（发布新内容）
- 没有 `UPDATE` / `DELETE` 策略，所以任何人（包括发布者本人）都无法修改或删除已发布内容
- 同时把表加入 `supabase_realtime` publication，前端用 Realtime 订阅新投递的内容

## 2. 本地开发

```bash
npm install
cp .env.example .env.local   # 填入你的 Supabase URL 和 anon key
npm run dev
```

## 3. 部署到 Vercel

推荐直接在 Vercel 网页控制台导入本仓库，几步就能完成，不需要本地安装 Vercel CLI：

1. 打开 https://vercel.com/new ，选择 **Import Git Repository**，选中这个仓库
   （分支 `claude/anonymous-tree-hole-site-90xvfb`，或先合并到主分支）
2. Framework Preset 会自动识别为 **Vite**，构建命令 `npm run build`，输出目录 `dist`
3. 在 **Environment Variables** 里添加：
   - `VITE_SUPABASE_URL` = `https://rumdtkhukjiyegagmrbj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon/publishable key
4. 点击 Deploy 即可

也可以用 CLI（需要先 `vercel login`）：

```bash
npm i -g vercel
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4（暗色主题、渐变光晕背景）
- Supabase（Postgres + RLS + Realtime，@supabase/supabase-js）
