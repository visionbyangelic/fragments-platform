-- Custom themes (26 Nov 2026).
-- Run once in the Supabase SQL editor, with 001, 002 and 003 if
-- those have not been run yet.
-- Lets a wall owner pick their own three colours (background,
-- accent, text) instead of a preset. Stored as JSON, e.g.
-- {"bg": "#2b1d16", "accent": "#e8a87c", "ink": "#f7ead9"}.
-- The wall derives the whole look from those three colours at
-- runtime (see src/lib/custom-theme.ts), so a custom wall always
-- stays readable. Publicly readable like the rest of the profile
-- (visitors see the wall in these colours), so it must never hold
-- anything private — it is colours, not a setting.

alter table public.profiles
  add column if not exists custom_theme jsonb;
