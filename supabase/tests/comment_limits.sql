-- Run against a disposable database after schema.sql, counter/rate-limit
-- migrations, and migration_comment_limits.sql. All fixtures are rolled back.
begin;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
declare
  owner_id text := auth.uid()::text;
  result jsonb;
begin
  insert into public.comments (id, app_id, author_id, author_name, body) values
    ('limit-root', 'ms:limit-post', owner_id, 'Test', 'Level one');
  insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
    ('limit-two', 'ms:limit-post', owner_id, 'Test', 'Level two', 'limit-root');
  insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
    ('limit-three', 'ms:limit-post', owner_id, 'Test', 'Level three', 'limit-two');
  insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
    ('limit-four', 'ms:limit-post', owner_id, 'Test', 'Level four', 'limit-three');
  begin
    insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
      ('limit-five', 'ms:limit-post', owner_id, 'Test', 'Level five', 'limit-four');
    raise exception 'TEST FAILED: fifth level accepted';
  exception when others then
    if sqlerrm <> 'Replies are limited to 4 levels.' then raise; end if;
  end;
  begin
    insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
      ('limit-cross', 'other-thread', owner_id, 'Test', 'Wrong thread', 'limit-root');
    raise exception 'TEST FAILED: cross-thread reply accepted';
  exception when others then
    if sqlerrm <> 'That comment belongs to another thread.' then raise; end if;
  end;
  begin
    update public.comments set parent_id = 'limit-four' where id = 'limit-root';
    raise exception 'TEST FAILED: reparenting accepted';
  exception when others then
    if sqlerrm <> 'Comments cannot be moved to another parent or thread.' then raise; end if;
  end;

  perform public.toggle_comment_like('limit-root');
  perform public.toggle_comment_like('limit-two');
  perform public.delete_comment('ms:limit-post', 'limit-root');
  assert (select is_deleted and likes = 0 from public.comments where id = 'limit-root');
  assert not exists (select 1 from public.comment_likes where comment_id = 'limit-root');
  assert (select likes = 1 from public.comments where id = 'limit-two');

  begin
    perform public.toggle_comment_like('limit-root');
    raise exception 'TEST FAILED: RPC liked deleted comment';
  exception when others then
    if sqlerrm <> 'This comment has been deleted.' then raise; end if;
  end;
  begin
    insert into public.comment_likes (comment_id, user_id) values ('limit-root', owner_id);
    raise exception 'TEST FAILED: direct insert liked deleted comment';
  exception when others then
    if sqlerrm <> 'This comment has been deleted.' then raise; end if;
  end;
  begin
    update public.comment_likes set comment_id = 'limit-root' where comment_id = 'limit-two';
    raise exception 'TEST FAILED: direct update liked deleted comment';
  exception when others then
    if sqlerrm <> 'This comment has been deleted.' then raise; end if;
  end;

  result := public.toggle_comment_like('limit-three');
  assert (result->>'liked')::boolean;
  result := public.toggle_comment_like('limit-four');
  assert (result->>'liked')::boolean;
  result := public.toggle_comment_like('limit-four');
  assert not (result->>'liked')::boolean;

  -- Deleted placeholders continue to count toward the nesting limit.
  begin
    insert into public.comments (id, app_id, author_id, author_name, body, parent_id) values
      ('limit-five', 'ms:limit-post', owner_id, 'Test', 'Still level five', 'limit-four');
    raise exception 'TEST FAILED: deleted ancestor bypassed nesting cap';
  exception when others then
    if sqlerrm <> 'Replies are limited to 4 levels.' then raise; end if;
  end;
  perform public.delete_comment('ms:limit-post', 'limit-two');
  perform public.delete_comment('ms:limit-post', 'limit-three');
  perform public.delete_comment('ms:limit-post', 'limit-four');
  assert not exists (select 1 from public.comments where app_id = 'ms:limit-post');
  assert not exists (select 1 from public.comment_likes where comment_id like 'limit-%');
end;
$$;
rollback;
