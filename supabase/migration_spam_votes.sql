-- Spam-vote pauses: rapid or sustained vote-button mashing pauses voting.
-- Two independent tripwires, both read from rate_hits (every toggle call is
-- logged there, on and off — unvotes delete app_votes rows, so counting that
-- table would miss flapping):
--   BURST: 5 toggles within 10 seconds (rapid clicking).
--   SUSTAINED: 10 toggles chained by gaps of 2–5 seconds each (steady
--     mashing with short pauses; shorter gaps are machine-rapid, longer
--     pauses break the chain and exempt).
-- Either tripwire pauses voting for 5 minutes. Normal browsing never trips:
-- humans don't click 5x in 10s or chain 10 votes back-to-back.
-- Run in the Supabase SQL editor (main project). Re-runnable.
-- Companion: toggle_app_vote below is mirrored in migration_counters.sql
-- for fresh installs (same check_vote_spam line).

-- Active pauses. RLS-locked like rate_hits (no policies: deny direct).
create table if not exists vote_timeouts (
  actor_id text primary key,
  until timestamptz not null
);
alter table vote_timeouts enable row level security;

create or replace function check_vote_spam()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_until timestamptz;
  v_secs int;
  v_n int;
  v_ts timestamptz[];
  v_run int := 1;
  v_gap numeric;
  i int;
begin
  if v_uid is null then
    raise exception 'Sign in to vote.';
  end if;
  -- Already paused: report remaining time, no new logging.
  select until into v_until from vote_timeouts where actor_id = v_uid;
  if found and v_until > now() then
    v_secs := ceil(extract(epoch from (v_until - now())))::int;
    if v_secs >= 60 then
      raise exception 'Voting is paused for another % minutes. Try again later.', ceil(v_secs / 60.0)::int;
    else
      raise exception 'Voting is paused for another % seconds. Try again later.', v_secs;
    end if;
  end if;
  -- Log this attempt, then judge it with its own history included.
  insert into rate_hits (actor_id, action) values (v_uid, 'vote:toggle');
  -- BURST: 5 toggles within 10 seconds.
  select count(*) into v_n from rate_hits
    where actor_id = v_uid and action = 'vote:toggle'
      and created_at > now() - interval '10 seconds';
  if v_n < 5 then
    -- SUSTAINED: walk the newest-first timestamps, counting the trailing
    -- chain linked by gaps of at most 5 seconds. A longer pause ends it.
    select array_agg(created_at order by created_at desc) into v_ts
      from (select created_at from rate_hits
              where actor_id = v_uid and action = 'vote:toggle'
              order by created_at desc limit 11) s;
    for i in 2..coalesce(array_length(v_ts, 1), 1) loop
      v_gap := extract(epoch from (v_ts[i - 1] - v_ts[i]));
      -- Only 2–5s gaps link the chain: sub-2s is machine-rapid (burst rule
      -- already covers it), over-5s pauses exempt.
      if v_gap < 2 or v_gap > 5 then
        exit;
      end if;
      v_run := v_run + 1;
    end loop;
    if v_run < 10 then
      return;
    end if;
  end if;
  insert into vote_timeouts (actor_id, until)
    values (v_uid, now() + interval '5 minutes')
    on conflict (actor_id) do update set until = excluded.until;
  raise exception 'Spamming detected — voting is paused for 5 minutes.';
end;
$$;

-- Same toggle as migration_counters.sql, with the spam gate instead of the
-- flat 30/min check. CREATE OR REPLACE so existing databases pick it up
-- from this file alone.
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
  perform check_vote_spam();
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

grant execute on function check_vote_spam() to authenticated;
grant execute on function toggle_app_vote(text) to authenticated;

-- Remaining pause for the caller, in whole seconds (0 = not paused).
-- Lets the UI answer "how much longer?" without attempting a toggle.
create or replace function vote_timeout_seconds()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid text := auth.uid()::text;
  v_until timestamptz;
begin
  if v_uid is null then
    return 0;
  end if;
  select until into v_until from vote_timeouts where actor_id = v_uid;
  if not found or v_until <= now() then
    return 0;
  end if;
  return ceil(extract(epoch from (v_until - now())))::int;
end;
$$;

grant execute on function vote_timeout_seconds() to authenticated;
