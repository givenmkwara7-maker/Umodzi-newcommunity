-- Run this entire file once in Supabase: SQL Editor > New query > Run.
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'givenmkwara7@gmail.com';
$$;

create table if not exists public.site_content (
  section text primary key check (section in ('posts', 'events', 'gallery', 'achievements', 'donors')),
  payload jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'donation-intent', 'volunteer')),
  name text not null,
  email text not null,
  phone text,
  area text,
  availability text,
  subject text,
  message text,
  amount numeric,
  method text,
  created_at timestamptz not null default now()
);

alter table public.site_content enable row level security;
alter table public.form_submissions enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content" on public.site_content for select using (true);
drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content" on public.site_content for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Visitors submit forms" on public.form_submissions;
create policy "Visitors submit forms" on public.form_submissions for insert with check (char_length(name) between 1 and 160 and char_length(email) between 3 and 320);
drop policy if exists "Admins read submissions" on public.form_submissions;
create policy "Admins read submissions" on public.form_submissions for select using (public.is_admin());
drop policy if exists "Admins delete submissions" on public.form_submissions;
create policy "Admins delete submissions" on public.form_submissions for delete using (public.is_admin());

insert into storage.buckets (id, name, public) values ('site-images', 'site-images', true) on conflict (id) do update set public = true;
drop policy if exists "Public reads site images" on storage.objects;
create policy "Public reads site images" on storage.objects for select using (bucket_id = 'site-images');
drop policy if exists "Admins manage site images" on storage.objects;
create policy "Admins manage site images" on storage.objects for all using (bucket_id = 'site-images' and public.is_admin()) with check (bucket_id = 'site-images' and public.is_admin());
