-- Constrain profile image URLs at the database boundary.
-- updateProfile validates image_url in every repo, but rows written around
-- the API (Supabase console, direct PostgREST) bypassed all of it, and the
-- column had no CHECK while every other URL column does. javascript: and
-- data:text/html payloads render inert inside <img>, yet they deface pages;
-- oversized data URLs bloat rows. Run in the Supabase SQL editor
-- (main project). Re-runnable.
-- Companion: isSafeImageUrl (src/utils/urls.ts) enforces the same rule
-- at render time for legacy rows.

alter table profiles drop constraint if exists profiles_image_url_valid;
alter table profiles add constraint profiles_image_url_valid
  check (
    image_url is null
    or image_url ilike 'https://%'
    or image_url ilike 'http://%'
    or image_url like 'data:image/%'
  );

alter table profiles drop constraint if exists profiles_image_url_length;
alter table profiles add constraint profiles_image_url_length
  check (image_url is null or char_length(image_url) <= 500000);
