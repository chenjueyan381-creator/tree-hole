# 希望你天天开心 · 匿名树洞

React + Supabase 实现的匿名树洞。像素风界面，暖色调背景，页面上有一只会自己溜达的
像素小猪「小克」。

**功能**

- 匿名发布：任何人无需登录即可发一段话
- 匿名回复：每条内容下面可以匿名回复，回复也不需要登录
- 按时间倒序展示，每条内容随机分配一个颜色和标签
- 管理后台：右下角连点 5 次唤出登录框，管理员登录后可以删除任何内容和回复

## 1. 建表 + 创建管理员账号

### 1.1 执行 SQL

1. 打开 Supabase 项目 → 左侧 **SQL Editor**
2. 新建查询，粘贴 [`supabase/schema.sql`](./supabase/schema.sql) 的**全部内容**
3. 点击 Run

脚本是幂等的，可以重复执行 —— 之前跑过旧版本的话，直接再跑一遍就会升级到最新结构
（新增 `replies` 表和管理员删除策略）。

创建出来的 RLS 策略：

| 操作 | 匿名访客 | 管理员 |
| --- | --- | --- |
| 读取内容 / 回复 | ✅ | ✅ |
| 发布内容 / 回复 | ✅ | ✅ |
| 删除内容 / 回复 | ❌ | ✅ |
| 修改内容 / 回复 | ❌ | ❌ |

删除内容时，它下面的回复会通过外键 `on delete cascade` 一起删掉。

### 1.2 创建管理员账号（必做，否则登录不了）

管理员密码**不在前端代码里**，校验完全交给 Supabase Auth，所以必须先手动建这个账号：

1. Supabase 控制台 → **Authentication → Users → Add user → Create new user**
2. 填写：
   - Email：`xiaojue@treehole.app`（**必须是这个**，RLS 策略按这个邮箱判定管理员）
   - Password：`111913`
   - 勾选 **Auto Confirm User**（否则要邮箱验证才能登录）
3. 建议顺手关掉公开注册：**Authentication → Providers → Email** 里关闭 *Enable sign ups*，
   否则任何人都能自己注册账号

前端登录框里输入的是**用户名 `xiaojue`**，代码会自动拼成上面那个邮箱去登录。

## 2. 本地开发

```bash
npm install
cp .env.example .env.local   # 填入 Supabase URL 和 anon key
npm run dev
```

## 3. 部署到 Vercel

在 Vercel 网页控制台导入本仓库最省事，不用装 CLI：

1. 打开 https://vercel.com/new → **Import Git Repository** → 选中这个仓库
2. Framework Preset 会自动识别为 **Vite**（构建命令 `npm run build`，输出目录 `dist`）
3. **Environment Variables** 里添加：
   - `VITE_SUPABASE_URL` = `https://rumdtkhukjiyegagmrbj.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = 你的 anon / publishable key
4. Deploy

## 4. 部署到 GitHub Pages（可选，与 Vercel 互不影响）

仓库里已经配好了 [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)，
推送到 `main` 或开发分支就会自动构建并发布。首次使用需要做两件事：

### 4.1 添加两个 secret

**Settings → Secrets and variables → Actions → New repository secret**，添加：

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://rumdtkhukjiyegagmrbj.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | 你的 anon / publishable key |

Vite 在**构建时**就把这两个值内联进产物，所以必须在 Actions 里提供，缺了会直接构建失败
并提示缺哪个（而不是默默部署一个打不开的页面）。

> 顺带说明：anon key 本来就是设计给浏览器用的公开 key，无论怎么部署它都会出现在打包产物里，
> 任何人都能从 JS 里读到 —— 这不是泄漏。真正的防线是数据库的 RLS 策略。用 secret 只是
> 避免它出现在 git 历史里（这个仓库是 public 的）。

### 4.2 把 Pages 的来源改成 Actions

**Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**（不是
"Deploy from a branch"）。不改这个的话，workflow 会在最后一步报错。

改完之后推一次代码，或者到 **Actions → Deploy to GitHub Pages → Run workflow** 手动跑一次。
站点地址是：

```
https://chenjueyan381-creator.github.io/tree-hole/
```

管理入口一样：加 `#admin`，或者连点标题 5 次。

### 关于 base 路径

Pages 的项目站点跑在 `/<仓库名>/` 子路径下，Vercel 跑在根路径，两者的资源前缀不一样。
所以 `vite.config.ts` 里的 `base` 是条件化的：只有 workflow 里设了 `GITHUB_PAGES=true`
才加子路径前缀，其他情况（本地开发、Vercel）一律用 `/`。**你现有的 Vercel 部署不受任何影响。**

仓库名是从 Actions 注入的 `GITHUB_REPOSITORY` 里取的，所以以后仓库改名也不用回来改配置。

### ⚠️ 国内访问

`*.github.io` 和 `*.vercel.app` 一样，在中国大陆是被墙的。换到 GitHub Pages **不能**解决
国内打不开的问题，它只是多一个免费的备用部署。想要国内能访问，见下面的说明。

## 关于国内访问

这个项目有两个境外依赖，**任意一个不通站点就用不了**：

- 前端：`*.vercel.app` / `*.github.io` —— 大陆均被墙
- 数据：`*.supabase.co` —— 大陆同样不稳定

排查时先分别确认：直接在浏览器打开 `https://<你的项目>.supabase.co/rest/v1/`，
返回 JSON 报错说明通，连不上说明也被墙了。页面能打开但一直卡在「加载中」= 前端通、Supabase 不通。

| 方案 | 能解决 | 代价 |
| --- | --- | --- |
| 绑自定义域名到 Vercel | 只解决前端 | 域名约 ¥50/年；通常有效但不保证 |
| 香港/新加坡 VPS，前后端都自建 | 两个都解决 | ¥40-100/月；**不需要 ICP 备案** |
| 国内云（阿里云/腾讯云） | 两个都解决，最快 | 必须 ICP 备案，1-3 周；匿名 UGC 站点合规上有额外要求 |

Supabase 本身开源，可以用 docker-compose 自建，前端只需改 `.env` 里那两个变量。

## 关于安全性

匿名树洞天然是「谁都能写」的，所以这里把能收紧的地方都收紧了：

- **管理员密码不落在前端**。登录走 `supabase.auth.signInWithPassword`，密码由 Supabase
  Auth 加盐哈希保存。前端的 `isAdmin` 只决定「要不要显示删除按钮」这种界面问题。
- **删除权限在数据库里判定**。RLS 的 delete 策略限定到管理员那一个邮箱，而不是笼统的
  `authenticated`，所以即使有人自己注册了账号、或者在浏览器里改掉前端状态，也删不掉任何
  数据。
- **没有任何 UPDATE 策略**，内容和回复发布后谁都改不了，管理员也只能删不能改。

## 关于像素字体

- 拉丁字符和数字用 **Press Start 2P** / **Silkscreen**，通过 `@fontsource` **自托管**
  打进产物，而不是用 Google Fonts 的 `<link>` —— Google Fonts 在中国大陆访问不了，
  用外链会直接加载失败退化成系统字体。
- 中文没有现成的像素字体可用（Press Start 2P、Silkscreen、VT323 这类都只有拉丁字形，
  中文像素字体如 Zpix / 缝合像素既不在 Google Fonts 也不在 npm 上）。所以标题
  「希望你天天开心」换了个做法：用系统中文字体把文字画到一张很小的 canvas 上，
  把每个像素的 alpha 做二值化处理去掉抗锯齿灰边，再用 `image-rendering: pixelated`
  整数倍放大 —— 得到的是真正的硬边点阵字。实现见
  [`src/components/PixelText.tsx`](./src/components/PixelText.tsx)，对任意中文都适用。

## 技术栈

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + 手写像素风样式（硬边框 + 硬阴影，一律直角）
- Supabase（Postgres + RLS + Auth + Realtime）
