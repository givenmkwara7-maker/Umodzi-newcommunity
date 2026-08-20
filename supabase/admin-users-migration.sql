-- Run once in Supabase SQL Editor to allow multiple administrator accounts.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'givenmkwara7@gmail.com'
on conflict (user_id) do update set email = excluded.email;

drop policy if exists "Owner manages admin users" on public.admin_users;
create policy "Owner manages admin users"
on public.admin_users for all
using (coalesce(auth.jwt() ->> 'email', '') = 'givenmkwara7@gmail.com')
with check (coalesce(auth.jwt() ->> 'email', '') = 'givenmkwara7@gmail.com');
