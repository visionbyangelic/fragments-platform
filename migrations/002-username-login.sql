-- Username sign-in throttle (25 Nov 2026).
-- Run once in the Supabase SQL editor, with 001-email-notifications.sql
-- if that has not been run yet.
-- Wall names are public, so guessing passwords against a name is easy;
-- /api/login counts failed tries here and locks a name for 15 minutes
-- after 5 failures. Only the server route (service role key) touches
-- this table; nobody reads it from the app.

create table if not exists public.login_attempts (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  success boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists login_attempts_identifier_idx
  on public.login_attempts (identifier, created_at desc);
