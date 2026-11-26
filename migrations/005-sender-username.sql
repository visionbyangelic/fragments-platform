-- Signed-in senders (26 Nov 2026).
-- Run once in the Supabase SQL editor, after 001-004.
-- When someone logged in on Fragments leaves a fragment or asks a
-- question, their wall username is stored with it, so the wall's
-- owner can see who it came from. Visitors never see it: the public
-- wall keeps showing the typed name or Anonymous, and the sender
-- name only ever renders for the wall's owner. Anonymous stays
-- anonymous — with the toggle on, no sender is stored at all.
-- Sealed fragments are deliberately left out: the sealed view does
-- not expose the sender, so nobody, not even the owner, learns who
-- sealed something before its day comes.
-- The insert policies only let a sender name through when it is the
-- logged-in user's own username (auth.uid() resolves it), so nobody
-- can sign someone else's name to a fragment or question.

alter table public.entries add column if not exists sender_username text;
alter table public.questions add column if not exists sender_username text;

drop policy if exists "anyone can leave a fragment" on public.entries;
create policy "anyone can leave a fragment" on public.entries for insert
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.wall_open = true and p.suspended = false)
    and (sender_username is null or sender_username = (select username from public.profiles where auth_user_id = auth.uid()))
  );

drop policy if exists "anyone can ask a question" on public.questions;
create policy "anyone can ask a question" on public.questions for insert
  with check (
    exists (select 1 from public.profiles p where p.id = profile_id and p.wall_open = true and p.suspended = false)
    and (sender_username is null or sender_username = (select username from public.profiles where auth_user_id = auth.uid()))
  );
