-- Guard the apps.votes counter: only toggle_app_vote may change it.
-- The "owners manage apps FOR ALL" policy lets owners UPDATE any column,
-- so an owner could PATCH votes to any number and rig the leaderboard.
-- This trigger rejects direct votes changes; toggle_app_vote sets a
-- transaction-local flag (app.votes_rpc) permitting its own +/-1 write.
-- PostgREST callers have no SQL surface to set that flag themselves.
-- Admins (when the admin-console migration has run) may still correct
-- counts by hand; everyone else must use the toggle. Run in the Supabase
-- SQL editor (main project). Re-runnable.
-- Companion: toggle_app_vote below is mirrored in migration_counters.sql
-- for fresh installs.

create or replace function guard_apps_votes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean := false;
begin
  if new.votes is distinct from old.votes
     and current_setting('app.votes_rpc', true) is distinct from 'on' then
    begin
      select exists (select 1 from admins where user_id = auth.uid()::text)
        into v_is_admin;
    exception when undefined_table then
      v_is_admin := false;
    end;
    if not v_is_admin then
      raise exception 'Change votes only through the vote toggle, not by editing the project.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists apps_votes_guard on apps;
create trigger apps_votes_guard
  before update on apps
  for each row execute function guard_apps_votes();

-- Same toggle as migration_counters.sql, plus the one flag line that
-- permits its guarded write. CREATE OR REPLACE so existing databases
-- pick it up by running this file alone.
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
  -- Permit the guarded counter write below for this transaction only.
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
