-- Custom wall prompt (26 Nov 2026).
-- Run once in the Supabase SQL editor, with 001 and 002 if those
-- have not been run yet.
-- Lets a wall owner write their own ask line, shown above the
-- fragment form instead of the default wording. Blank means the
-- default line. Publicly readable like the rest of the profile
-- (it is shown to every visitor), so it must never hold anything
-- private — it is a prompt, not a setting.

alter table public.profiles
  add column if not exists custom_prompt text;
