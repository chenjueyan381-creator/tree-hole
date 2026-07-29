-- 匿名树洞网站 数据库结构
-- 在 Supabase 控制台 -> SQL Editor 中粘贴并运行整段脚本
-- （anon key 权限不足以建表，必须用控制台或拥有数据库密码的连接执行一次）

-- 如果你已经执行过旧版本（标签文案已改），且表里还没有正式数据，
-- 想重新初始化的话，先取消注释下面这行再执行本文件：
-- drop table if exists public.confessions cascade;

create extension if not exists pgcrypto;

create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 500),
  color text not null check (color in (
    '#f97316', '#ec4899', '#8b5cf6', '#06b6d4',
    '#22c55e', '#eab308', '#ef4444', '#3b82f6'
  )),
  tag text not null check (tag in (
    '随笔', '深夜', '路过', '小事',
    '碎碎念', '随手记', '心情', '无题'
  )),
  created_at timestamptz not null default now()
);

create index if not exists confessions_created_at_idx
  on public.confessions (created_at desc);

alter table public.confessions enable row level security;

-- 任何人（包括未登录的匿名访客）都可以读取全部内容
drop policy if exists "Public can read confessions" on public.confessions;
create policy "Public can read confessions"
  on public.confessions
  for select
  to anon, authenticated
  using (true);

-- 任何人都可以匿名发布一条新内容
drop policy if exists "Public can insert confessions" on public.confessions;
create policy "Public can insert confessions"
  on public.confessions
  for insert
  to anon, authenticated
  with check (true);

-- 不创建 update / delete 策略：
-- 开启 RLS 后没有对应策略 = 任何人都无法修改或删除已发布的内容（包括发布者本人），
-- 符合"不能回复/不能编辑"的树洞设定。

-- 可选：开启 Realtime，让新投递的内容实时推送到所有在线用户
alter publication supabase_realtime add table public.confessions;
