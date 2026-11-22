-- Fragments platform schema (multi-user). Run once in the SQL editor.
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  display_name text not null default '',
  theme text not null default 'dusk',
  wall_open boolean not null default true,
  suspended boolean not null default false,
  is_platform_admin boolean not null default false,
  auth_user_id uuid unique,
  created_at timestamptz not null default now()
);
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  message text not null,
  color text not null default 'blush',
  shape text not null default 'rounded',
  is_visible boolean not null default true,
  is_private boolean not null default false,
  is_favorite boolean not null default false,
  reveal_date timestamptz,
  created_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text,
  question text not null,
  answer text,
  is_anonymous boolean not null default true,
  is_published boolean not null default false,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);
create index entries_profile_idx on public.entries(profile_id, created_at desc);
create index questions_profile_idx on public.questions(profile_id, created_at desc);

-- Sealed fragments: safe public placeholders (no message text) until reveal date.
create view public.sealed_entries as
  select id, profile_id, name, reveal_date, created_at
  from public.entries
  where reveal_date is not null and reveal_date > now() and is_visible = true and is_private = false;

-- The platform owner claims the seeded "angelic" profile by signing in
-- with the owner email. Security definer so it can link the row once.
create or replace function public.claim_angelic_profile()
returns void language plpgsql security definer set search_path = public as $$
begin
  if (auth.jwt() ->> 'email') = 'visionbyangelic@gmail.com' then
    update public.profiles set auth_user_id = auth.uid()
    where username = 'angelic' and auth_user_id is null;
  end if;
end; $$;

alter table public.profiles enable row level security;
alter table public.entries enable row level security;
alter table public.questions enable row level security;
alter table public.reports enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users create their profile" on public.profiles for insert to authenticated
  with check (auth_user_id = auth.uid());
create policy "owners update their profile" on public.profiles for update to authenticated
  using (auth_user_id = auth.uid()) with check (auth_user_id = auth.uid());
create policy "platform admins update any profile" on public.profiles for update to authenticated
  using (exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.is_platform_admin))
  with check (true);

create policy "read open entries" on public.entries for select using (
  (reveal_date is null or reveal_date <= now()) and (
    (is_visible = true and is_private = false)
    or profile_id in (select id from public.profiles where auth_user_id = auth.uid())
  )
);
create policy "anyone can leave a fragment" on public.entries for insert
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.wall_open = true and p.suspended = false));
create policy "owners moderate entries" on public.entries for update to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners delete entries" on public.entries for delete to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "read published or own questions" on public.questions for select using (
  is_published = true
  or profile_id in (select id from public.profiles where auth_user_id = auth.uid())
);
create policy "anyone can ask a question" on public.questions for insert
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.wall_open = true and p.suspended = false));
create policy "owners manage questions" on public.questions for update to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()))
  with check (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));
create policy "owners delete questions" on public.questions for delete to authenticated
  using (profile_id in (select id from public.profiles where auth_user_id = auth.uid()));

create policy "anyone can report a wall" on public.reports for insert with check (true);
create policy "platform admins read reports" on public.reports for select to authenticated
  using (exists (select 1 from public.profiles p where p.auth_user_id = auth.uid() and p.is_platform_admin));

grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant select, insert on public.entries to anon, authenticated;
grant update, delete on public.entries to authenticated;
grant select, insert on public.questions to anon, authenticated;
grant update, delete on public.questions to authenticated;
grant insert on public.reports to anon, authenticated;
grant select on public.reports to authenticated;
grant select on public.sealed_entries to anon, authenticated;
grant execute on function public.claim_angelic_profile() to authenticated;

insert into public.profiles (username, display_name, theme, is_platform_admin)
values ('angelic', 'Angelic', 'dusk', true);

alter publication supabase_realtime add table public.entries;
alter publication supabase_realtime add table public.questions;
