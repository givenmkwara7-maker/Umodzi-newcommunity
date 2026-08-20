-- Run this once in Supabase SQL Editor to make deleted messages and volunteer applications recoverable.
alter table public.form_submissions add column if not exists deleted_at timestamptz;

drop policy if exists "Admins update submissions" on public.form_submissions;
create policy "Admins update submissions"
on public.form_submissions for update
using (public.is_admin()) with check (public.is_admin());
