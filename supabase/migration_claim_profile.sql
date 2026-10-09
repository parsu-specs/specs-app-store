-- Self-serve profile claim as one atomic server transaction.
-- Before this, claiming was a client-side loop (~15 sequential updates with
-- the caller's JWT): no transaction (partial merges possible), no server
-- check (anyone passing the display-name comparison in UI could merge and
-- delete another profile), and — since migration_authorship.sql — it fails
-- closed under RLS anyway. Now the requester is derived from auth.uid(),
-- never from a parameter: the only input is which duplicate to absorb.
-- Run in the Supabase SQL editor (main project). Re-runnable.
-- Companion: supabaseRepos.claimProfile now calls this RPC instead of looping.

create or replace function claim_profile(p_from text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_to text := auth.uid()::text;
  v_from_name text;
  v_to_name text;
begin
  if v_to is null then
    raise exception 'Sign in to claim a profile.';
  end if;
  if p_from is null or p_from = '' then
    raise exception 'Choose a profile to claim.';
  end if;
  if p_from = v_to then
    raise exception 'That is already your profile.';
  end if;
  select trim(name) into v_from_name from profiles where id = p_from;
  if not found then
    raise exception 'Profile not found.';
  end if;
  select trim(name) into v_to_name from profiles where id = v_to;
  if not found then
    raise exception 'Your profile was not found. Sign out and sign in again.';
  end if;
  if lower(v_from_name) != lower(v_to_name) then
    raise exception 'You can only claim a profile with your exact display name.';
  end if;

  -- Move owned content to the requester in set operations (no loops,
  -- all-or-nothing inside this transaction).
  update apps set creator_id = v_to, creator = v_to_name where creator_id = p_from;
  update comments set author_id = v_to, author_name = v_to_name where author_id = p_from;
  update milestones set author_id = v_to, author_name = v_to_name where author_id = p_from;

  insert into app_votes (app_id, user_id)
    select app_id, v_to from app_votes where user_id = p_from
    on conflict do nothing;
  delete from app_votes where user_id = p_from;

  insert into comment_likes (comment_id, user_id)
    select comment_id, v_to from comment_likes where user_id = p_from
    on conflict do nothing;
  delete from comment_likes where user_id = p_from;

  insert into milestone_cheers (milestone_id, user_id)
    select milestone_id, v_to from milestone_cheers where user_id = p_from
    on conflict do nothing;
  delete from milestone_cheers where user_id = p_from;

  delete from profiles where id = p_from;

  -- Best-effort audit (admin_audit exists only when the admin-console
  -- migration has been run; claiming must not fail without it).
  begin
    insert into admin_audit (actor_id, action, target_table, target_id, detail)
      values (v_to, 'claim', 'profiles', p_from, 'merged into ' || v_to);
  exception when undefined_table then
    null;
  end;
end;
$$;

grant execute on function claim_profile(text) to authenticated;
