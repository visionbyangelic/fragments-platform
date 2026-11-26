-- 007: record senders for a possible future paid reveal, and
-- tag every fragment and question with its browser.
--
-- Two things change about what is stored:
--
-- 1. A logged-in sender's username is now recorded even when they
--    leave it anonymously. sender_hidden marks those rows, and the
--    owner is only ever shown a sender name when it is false — so
--    today nothing looks different, and the name is banked in case
--    revealing senders ever becomes a paid feature. Questions already
--    carry is_anonymous for the same job, so they need no new flag.
--
-- 2. Every fragment and question carries sender_visitor_id: a random
--    id minted in the sender's browser on first use (localStorage).
--    It is not a name or an account, only "the same browser sent
--    these". When that browser later signs in, the rows where the
--    visitor id and a username appear together link the two.
--
-- No policy change is needed: the insert policies already let a
-- sender name through only when it is the logged-in user's own, and
-- the new columns are unconstrained. The sealed_entries view lists
-- its columns explicitly, so the new columns do not leak into it.
alter table public.entries add column if not exists sender_visitor_id text;
alter table public.questions add column if not exists sender_visitor_id text;
alter table public.entries add column if not exists sender_hidden boolean not null default false;
