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
