-- 008: polls, reactions, replies, collections, capsules, letters,
-- profile fields, reserved names (26 Nov 2026).
--
-- Everything here is text and small rows: a poll vote is ~120 bytes,
-- a reaction ~150, a letter a few KB like a fragment. Nothing here
-- moves the free tier. Voice messages would; they are not in this
-- migration, on purpose. Email delivery is not in it either: letters
-- are stored and revealed on site, and the email that would deliver
-- them waits for the domain.

-- Profile fields: bio, social links, wall sections, question of the
-- day, featured fragment.
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists social_links jsonb not null default '[]';
alter table public.profiles add column if not exists sections jsonb not null default '{}';
alter table public.profiles add column if not exists qotd text;
alter table public.profiles add column if not exists featured_entry_id uuid references public.entries(id) on delete set null;

-- Reserved names, as a backstop behind the app list in
-- src/lib/platform.ts (same list, kept in step with it).
alter table public.profiles add constraint profiles_username_not_reserved
  check (username not in ('owner','admin','administrator','moderator','mod','staff','root','webmaster','contact','info','system','support','fragments','login','logout','signup','signin','gate','heavenly-gate','api','app','www','mail','help','about','index','home','settings','platform','official','team','beta','test','null','undefined','facebook','instagram','twitter','tiktok','youtube','snapchat','whatsapp','telegram','linkedin','pinterest','spotify','twitch','discord','reddit','threads','meta','google','apple','netflix'));

-- Polls: one question, 2 to 4 options, optional end date. One active
-- poll per wall is an app rule, not a database one.
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  question text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 4),
  expires_at timestamptz,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  visitor_id text not null,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  unique (poll_id, visitor_id)
);

-- Reactions: heart / laugh / warm, one per browser per fragment.
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  visitor_id text not null,
  emoji text not null check (emoji in ('heart', 'laugh', 'warm')),
  created_at timestamptz not null default now(),
  unique (entry_id, visitor_id, emoji)
);

-- Owner replies: one public reply per fragment.
create table if not exists public.fragment_replies (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade unique,
  reply text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Memory Box collections: the owner's private labels for fragments.
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (collection_id, entry_id)
);

-- Time capsules: a title and a date, with contributions sealed until it.
create table if not exists public.capsules (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  reveal_date timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists public.capsule_contributions (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.capsules(id) on delete cascade,
  name text,
  message text not null,
  sender_username text,
  sender_visitor_id text,
  created_at timestamptz not null default now()
);

-- Dear Future Me letters (placeholder: stored and revealed on site;
-- the delivery email waits for the domain).
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  letter text not null,
  deliver_date timestamptz not null,
  opened boolean not null default false,
  created_at timestamptz not null default now()
);

-- Capsule contributions, sealed until the reveal date, in the same
-- shape as sealed_entries: the message reads null until the day
-- comes, for everyone including the owner.
create or replace view public.capsule_contributions_public as
  select cc.id, cc.capsule_id, cc.name, cc.created_at,
    case when c.reveal_date <= now() then cc.message else null end as message
  from public.capsule_contributions cc
  join public.capsules c on c.id = cc.capsule_id;
grant select on public.capsule_contributions_public to anon, authenticated;

alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.reactions enable row level security;
alter table public.fragment_replies enable row level security;
alter table public.collections enable row level security;
alter table public.collection_items enable row level security;
alter table public.capsules enable row level security;
alter table public.capsule_contributions enable row level security;
alter table public.letters enable row level security;

-- Polls are public to read; only the wall's owner writes them.
create policy "polls are public" on public.polls for select using (true);
create policy "owners manage polls" on public.polls for insert to authenticated
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners update polls" on public.polls for update to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners delete polls" on public.polls for delete to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- Votes are public to read; anyone can cast one while the poll is open.
create policy "votes are public" on public.poll_votes for select using (true);
create policy "anyone can vote" on public.poll_votes for insert
  with check (
    exists (select 1 from public.polls p where p.id = poll_id and p.closed = false and (p.expires_at is null or p.expires_at > now()))
  );

-- Reactions are public to read; anyone can add or take back their own.
create policy "reactions are public" on public.reactions for select using (true);
create policy "anyone can react" on public.reactions for insert with check (true);
create policy "anyone can unreact" on public.reactions for delete using (true);

-- Owner replies are public to read; only the fragment's owner writes them.
create policy "replies are public" on public.fragment_replies for select using (true);
create policy "owners manage replies" on public.fragment_replies for insert to authenticated
  with check (entry_id in (select e.id from public.entries e where e.profile_id in (select id from public.profiles where auth_user_id = auth.uid())));
create policy "owners update replies" on public.fragment_replies for update to authenticated
  using (entry_id in (select e.id from public.entries e where e.profile_id in (select id from public.profiles where auth_user_id = auth.uid())))
  with check (entry_id in (select e.id from public.entries e where e.profile_id in (select id from public.profiles where auth_user_id = auth.uid())));
create policy "owners delete replies" on public.fragment_replies for delete to authenticated
  using (entry_id in (select e.id from public.entries e where e.profile_id in (select id from public.profiles where auth_user_id = auth.uid())));

-- Collections are the owner's alone.
create policy "owners manage collections" on public.collections for all to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners manage collection items" on public.collection_items for all to authenticated
  using (collection_id in (select c.id from public.collections c where c.profile_id in (select id from public.profiles where auth_user_id = auth.uid())))
  with check (collection_id in (select c.id from public.collections c where c.profile_id in (select id from public.profiles where auth_user_id = auth.uid())));

-- Capsules are public to read; only the wall's owner writes them.
create policy "capsules are public" on public.capsules for select using (true);
create policy "owners manage capsules" on public.capsules for insert to authenticated
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners update capsules" on public.capsules for update to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners delete capsules" on public.capsules for delete to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

-- Contributions are written by anyone and read through the public
-- view only, so the message stays sealed until the reveal date.
create policy "anyone can contribute" on public.capsule_contributions for insert
  with check (exists (select 1 from public.capsules c where c.id = capsule_id));

-- Letters are the owner's alone.
create policy "owners manage letters" on public.letters for all to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

grant select on public.polls to anon, authenticated;
grant insert, update, delete on public.polls to authenticated;
grant select, insert on public.poll_votes to anon, authenticated;
grant select, insert, delete on public.reactions to anon, authenticated;
grant select on public.fragment_replies to anon, authenticated;
grant insert, update, delete on public.fragment_replies to authenticated;
grant select, insert, update, delete on public.collections to authenticated;
grant select, insert, update, delete on public.collection_items to authenticated;
grant select on public.capsules to anon, authenticated;
grant insert, update, delete on public.capsules to authenticated;
grant insert on public.capsule_contributions to anon, authenticated;
grant select, insert, update, delete on public.letters to authenticated;
