-- 006-theme-overrides.sql
-- Per-wall theme overrides (the customisation editor): colours, font,
-- decorations and card style on top of the base theme. Everything is
-- optional; absent fields fall back to the theme. Plain JSON, so a
-- customised look can later be saved under a name and shared with
-- another wall without a schema change.
--
-- The retired theme names are NOT remapped here. The new twelve are
-- trialled on the owner's wall only, so the other walls keep their
-- old themes, and the remap waits for the full rollout.
alter table public.profiles
  add column if not exists theme_overrides jsonb;
