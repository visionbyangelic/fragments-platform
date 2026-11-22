# Fragments

Your own anonymous wall.

Fragments started as my personal message wall. This is the version anyone can use: claim a username, get a link, share it anywhere, and collect anonymous fragments from the people who pass through your life.

## What a wall does

- Anyone with your link can leave a fragment: a memory, a wish, a few kind words. Signed or anonymous.
- They can also ask you a question instead, which you answer from your private backend when you feel like it.
- A fragment can be **sealed** until a future date. Nobody can read it before the day arrives, not even the wall's owner. It opens itself when the day comes.
- Every wall is moderated by its owner: read everything in your gate, hide or delete what you do not want, keep the ones you love.
- Anonymous means anonymous. There are no paid hints about who wrote what, and there never will be.

## How it is built

- One app, one database. Every wall lives at `/username`, and row level security in Postgres is what keeps each person's backend private to them.
- React with TanStack Start, styled with the same two themes as my personal wall (Dusk by default, Pink Dream one tap away).
- Supabase for the database, accounts and realtime updates. Hosted on Vercel.

## Running it locally

```bash
bun install
bun run dev
```

You will need a `.env` with your own Supabase project's URL and publishable key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, plus the same values without the `VITE_` prefix for the server). The database schema lives in `supabase/schema.sql`.

## Status

Early. Built for the first hundred walls or so, growing from there.
