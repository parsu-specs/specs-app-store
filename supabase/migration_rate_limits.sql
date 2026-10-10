-- Per-user throttles enforced inside Postgres (no backend required).
-- Flood scripts hit these before any write lands: vote/like/cheer toggles
-- check in (30/min each), comment/milestone posts via insert triggers
-- (10/min and 5/min). Limits are generous to humans — only scripts trip.
-- Tune the numbers below to taste. Run in the Supabase SQL editor
-- (main project). Re-runnable.
-- Companion: the three toggle functions are mirrored in
-- migration_counters.sql for fresh installs (same check_rate lines).

-- Hit log: direct access denied to everyone (RLS, no policies); only the
-- SECURITY DEFINER paths below can read/write it.
create table if not exists rate_hits (
  actor_id text not null,
  action text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_hits_actor_action_idx
  on rate_hits (actor_id, action, created_at desc);
alter table rate_hits enable row level security;

create or replace function check_rate(p_action text, p_limit int, p_window interval)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_n int;
begin
  if v_uid is null then
    raise exception 'Sign in first.';
  end if;
  -- Prune anything older than an hour on every call (indexed, cheap).
  delete from rate_hits where created_at < now() - interval '1 hour';
  select count(*) into v_n from rate_hits
    where actor_id = v_uid and action = p_action and created_at > now() - p_window;
  if v_n >= p_limit then
    raise exception 'Slow down — too many requests. Try again in a bit.';
  end if;
  insert into rate_hits (actor_id, action) values (v_uid, p_action);
end;
$$;

-- Comment + milestone posts are direct inserts (not RPCs), so triggers
-- enforce their limits. RLS already guarantees authenticated-only inserts,
-- so auth.uid() is the caller here. Admin bulk work falls under the same
-- generous caps.
create or replace function rate_limit_comments()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_rate('comment:post', 10, interval '1 minute');
  return new;
end;
$$;

drop trigger if exists comments_rate_guard on comments;
create trigger comments_rate_guard
  before insert on comments
  for each row execute function rate_limit_comments();

create or replace function rate_limit_milestones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform check_rate('milestone:post', 5, interval '1 minute');
  return new;
end;
$$;

drop trigger if exists milestones_rate_guard on milestones;
create trigger milestones_rate_guard
  before insert on milestones
  for each row execute function rate_limit_milestones();

-- Same toggles as migration_counters.sql, plus one check_rate line each.
-- CREATE OR REPLACE so existing databases pick them up from this file alone.
create or replace function toggle_app_vote(p_app_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_row apps%rowtype;
  v_liked boolean;
begin
  if v_uid is null then
    raise exception 'Sign in to vote.';
  end if;
  perform check_rate('vote:toggle', 30, interval '1 minute');
  -- Permit the guarded counter write below for this transaction only
  -- (see the apps_votes_guard trigger in migration_votes_guard.sql).
  perform set_config('app.votes_rpc', 'on', true);
  if exists (select 1 from app_votes where app_id = p_app_id and user_id = v_uid) then
    delete from app_votes where app_id = p_app_id and user_id = v_uid;
    update apps set votes = greatest(0, votes - 1) where id = p_app_id returning * into v_row;
    v_liked := false;
  else
    insert into app_votes (app_id, user_id) values (p_app_id, v_uid);
    update apps set votes = votes + 1 where id = p_app_id returning * into v_row;
    v_liked := true;
  end if;
  if v_row.id is null then
    raise exception 'Project not found.';
  end if;
  return jsonb_build_object('row', to_jsonb(v_row), 'liked', v_liked);
end;
$$;

create or replace function toggle_comment_like(p_comment_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_row comments%rowtype;
  v_liked boolean;
begin
  if v_uid is null then
    raise exception 'Sign in to like.';
  end if;
  perform check_rate('like:toggle', 30, interval '1 minute');
  if exists (select 1 from comment_likes where comment_id = p_comment_id and user_id = v_uid) then
    delete from comment_likes where comment_id = p_comment_id and user_id = v_uid;
    update comments set likes = greatest(0, likes - 1) where id = p_comment_id returning * into v_row;
    v_liked := false;
  else
    insert into comment_likes (comment_id, user_id) values (p_comment_id, v_uid);
    update comments set likes = likes + 1 where id = p_comment_id returning * into v_row;
    v_liked := true;
  end if;
  if v_row.id is null then
    raise exception 'Comment not found.';
  end if;
  return jsonb_build_object('row', to_jsonb(v_row), 'liked', v_liked);
end;
$$;

create or replace function toggle_milestone_cheer(p_milestone_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_row milestones%rowtype;
  v_liked boolean;
begin
  if v_uid is null then
    raise exception 'Sign in to cheer.';
  end if;
  perform check_rate('cheer:toggle', 30, interval '1 minute');
  if exists (select 1 from milestone_cheers where milestone_id = p_milestone_id and user_id = v_uid) then
    delete from milestone_cheers where milestone_id = p_milestone_id and user_id = v_uid;
    update milestones set cheers = greatest(0, cheers - 1) where id = p_milestone_id returning * into v_row;
    v_liked := false;
  else
    insert into milestone_cheers (milestone_id, user_id) values (p_milestone_id, v_uid);
    update milestones set cheers = cheers + 1 where id = p_milestone_id returning * into v_row;
    v_liked := true;
  end if;
  if v_row.id is null then
    raise exception 'Update not found.';
  end if;
  return jsonb_build_object('row', to_jsonb(v_row), 'liked', v_liked);
end;
$$;

grant execute on function check_rate(text, int, interval) to authenticated;
grant execute on function toggle_app_vote(text) to authenticated;
grant execute on function toggle_comment_like(text) to authenticated;
grant execute on function toggle_milestone_cheer(text) to authenticated;
