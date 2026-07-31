-- 匿名树洞网站 数据库结构
-- 在 Supabase 控制台 -> SQL Editor 中粘贴并运行整段脚本。
-- 本脚本是幂等的：可以重复执行，会自动把旧版本的表升级到最新结构。

-- ============================================================
-- 管理员账号：必须先在 Supabase 控制台手动创建
-- ============================================================
-- Authentication -> Users -> Add user -> Create new user
--   Email:    xiaojue2026@gmail.com   （必须和下面 RLS 策略里的邮箱完全一致）
--   Password: 你自己设定的密码（不写在代码里，由 Supabase Auth 加盐哈希保存）
--   勾选 "Auto Confirm User"（否则需要邮箱验证才能登录）
--
-- 前端登录框填完整邮箱即可（只填 xiaojue2026 也行，会自动补 @gmail.com）。
--
-- 另外建议关闭公开注册，否则任何人都能注册账号：
--   Authentication -> Providers -> Email -> 关闭 "Enable sign ups"

create extension if not exists pgcrypto;

-- ============================================================
-- 树洞内容
-- ============================================================

create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  color text not null,
  tag text not null,
  created_at timestamptz not null default now()
);

-- 约束单独声明，方便重复执行时更新为最新的取值范围。
-- 用 not valid 只校验新写入的行，避免历史数据导致升级失败。
alter table public.confessions
  drop constraint if exists confessions_content_length;
alter table public.confessions
  add constraint confessions_content_length
  check (char_length(content) between 1 and 500) not valid;

alter table public.confessions
  drop constraint if exists confessions_color_allowed;
alter table public.confessions
  add constraint confessions_color_allowed
  check (color in (
    '#e8643c', '#f0977a', '#e0a32e', '#7fa650',
    '#3f9e8c', '#4a7fb5', '#8b6bb0', '#d4568c'
  )) not valid;

alter table public.confessions
  drop constraint if exists confessions_tag_allowed;
alter table public.confessions
  add constraint confessions_tag_allowed
  check (tag in (
    '随笔', '深夜', '路过', '小事',
    '碎碎念', '随手记', '心情', '无题'
  )) not valid;

create index if not exists confessions_created_at_idx
  on public.confessions (created_at desc);

-- ============================================================
-- 匿名回复
-- ============================================================

create table if not exists public.replies (
  id uuid primary key default gen_random_uuid(),
  -- on delete cascade：删除一条内容会连带删掉它下面所有回复
  confession_id uuid not null
    references public.confessions (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.replies
  drop constraint if exists replies_content_length;
alter table public.replies
  add constraint replies_content_length
  check (char_length(content) between 1 and 300) not valid;

create index if not exists replies_confession_id_idx
  on public.replies (confession_id, created_at);

-- ============================================================
-- RLS：匿名可读可写，只有管理员可删
-- ============================================================

alter table public.confessions enable row level security;
alter table public.replies enable row level security;

-- 任何人（包括未登录访客）都可以读取全部内容和回复
drop policy if exists "Public can read confessions" on public.confessions;
create policy "Public can read confessions"
  on public.confessions for select
  to anon, authenticated
  using (true);

drop policy if exists "Public can read replies" on public.replies;
create policy "Public can read replies"
  on public.replies for select
  to anon, authenticated
  using (true);

-- 任何人都可以匿名发布内容和回复
drop policy if exists "Public can insert confessions" on public.confessions;
create policy "Public can insert confessions"
  on public.confessions for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public can insert replies" on public.replies;
create policy "Public can insert replies"
  on public.replies for insert
  to anon, authenticated
  with check (true);

-- 只有管理员这一个账号可以删除。
-- 注意这里限定到具体邮箱，而不是笼统的 authenticated —— 否则任何注册用户都能删。
drop policy if exists "Admin can delete confessions" on public.confessions;
create policy "Admin can delete confessions"
  on public.confessions for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'xiaojue2026@gmail.com');

drop policy if exists "Admin can delete replies" on public.replies;
create policy "Admin can delete replies"
  on public.replies for delete
  to authenticated
  using (auth.jwt() ->> 'email' = 'xiaojue2026@gmail.com');

-- 没有创建任何 UPDATE 策略，所以内容和回复发布后都无法被修改（包括管理员）。
-- 管理员只有"删除"这一种干预手段。

-- ============================================================
-- Realtime：新内容/新回复/删除实时推送给所有在线用户
-- ============================================================

do $$
begin
  begin
    alter publication supabase_realtime add table public.confessions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.replies;
  exception when duplicate_object then null;
  end;
end $$;

-- 删除事件默认只推送主键。设为 full 才能在前端收到被删行的完整内容，
-- 这里其实只需要 id，但设成 full 更省心。
alter table public.confessions replica identity full;
alter table public.replies replica identity full;
