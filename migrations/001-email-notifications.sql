-- Email notifications for wall owners (25 Nov 2026).
-- Run this once in the Supabase SQL editor, after the code is deployed.
-- The /api/notify server route does the sending; this only adds the
-- owner's opt-out switch and a dedupe log so one fragment or question
-- can only ever send one email, even if the notify call is retried.

alter table public.profiles
  add column if not exists email_notifications boolean not null default true;

-- One row per sent notification. The server route inserts here first;
-- a second insert for the same row conflicts and the email is skipped.
create table if not exists public.notification_log (
  kind text not null check (kind in ('fragment', 'question')),
  row_id uuid not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (kind, row_id)
);

-- Nobody reads this table from the app; only the server route (service
-- role key) touches it. No grants to anon/authenticated on purpose.
