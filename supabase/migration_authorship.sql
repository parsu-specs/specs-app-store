-- Bind authorship on inserts: the row's author_id/user_id must equal the caller.
-- Before this change the five insert policies below checked only
-- auth.role() = 'authenticated', so any signed-in user could insert
-- comments/milestones/votes/likes/cheers attributing ANOTHER user's id
-- (reputation forgery, fake accusations, spoofed voter lists).
-- Legitimate app flows are unaffected: the UI always writes the signed-in
-- user's own id, and the toggle_*/delete_* RPCs use auth.uid() internally.
-- Run in the Supabase SQL editor (main project). Re-runnable.
-- Companion: the same policies are mirrored in schema.sql for fresh installs.

drop policy if exists "signed-in insert app_votes" on app_votes;
create policy "signed-in insert app_votes" on app_votes
  for insert with check (auth.role() = 'authenticated' and auth.uid()::text = user_id);

drop policy if exists "signed-in insert comments" on comments;
create policy "signed-in insert comments" on comments
  for insert with check (auth.role() = 'authenticated' and auth.uid()::text = author_id);

drop policy if exists "signed-in insert comment_likes" on comment_likes;
create policy "signed-in insert comment_likes" on comment_likes
  for insert with check (auth.role() = 'authenticated' and auth.uid()::text = user_id);

drop policy if exists "signed-in insert milestones" on milestones;
create policy "signed-in insert milestones" on milestones
  for insert with check (auth.role() = 'authenticated' and auth.uid()::text = author_id);

drop policy if exists "signed-in insert milestone_cheers" on milestone_cheers;
create policy "signed-in insert milestone_cheers" on milestone_cheers
  for insert with check (auth.role() = 'authenticated' and auth.uid()::text = user_id);
