-- One display name per developer (case-insensitive).
-- Self-serve profile claiming is removed, so duplicates can no longer merge
-- themselves away — instead they can never be created: renames collide in
-- the repo layer with a friendly error, and this index is the backstop.
-- IMPORTANT: run the duplicate check below FIRST. If it returns rows, merge
-- or delete them (admin SQL) before running the CREATE INDEX, or it fails
-- with zero changes applied (safe, but nothing is enforced until it passes).
--
--   select lower(trim(name)) as name, count(*), string_agg(id, ', ')
--     from profiles group by 1 having count(*) > 1;
--
-- Run in the Supabase SQL editor (main project). Re-runnable.
-- Companion: mirrored in schema.sql for fresh installs.

create unique index if not exists profiles_lower_name_unique
  on profiles (lower(btrim(name)));
