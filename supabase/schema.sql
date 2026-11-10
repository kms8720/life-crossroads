-- Stores one row per finished playthrough.
-- The public key can add rows and read the totals, but it cannot read individual rows or names.

create table if not exists public.plays (
  id bigint generated always as identity primary key,
  run_id text not null unique check (char_length(run_id) <= 40),
  nickname text not null check (char_length(nickname) between 1 and 20),
  ending text not null,
  gauges jsonb not null,
  picks jsonb not null,
  created_at timestamptz not null default now()
);

-- Endings are the gauge keys in content.json plus 'balance'. Older rows are left as they are.
alter table public.plays drop constraint if exists plays_ending_check;
alter table public.plays add constraint plays_ending_check
  check (ending in ('money', 'fame', 'health', 'connection', 'balance')) not valid;

alter table public.plays enable row level security;

-- The public key gets one table permission only, whatever the project's defaults are.
revoke all on public.plays from anon, authenticated;
-- Student ID and the character the player picked ('m' or 'f'). Like nicknames, the publishable key can write them but never read them.
alter table public.plays add column if not exists student_id text;
alter table public.plays add column if not exists gender text;
alter table public.plays drop constraint if exists plays_student_id_check;
alter table public.plays add constraint plays_student_id_check check (student_id is null or char_length(student_id) between 1 and 20) not valid;
alter table public.plays drop constraint if exists plays_gender_check;
alter table public.plays add constraint plays_gender_check check (gender is null or gender in ('m', 'f')) not valid;
grant insert on public.plays to anon;

drop policy if exists "anyone can add a play" on public.plays;
create policy "anyone can add a play" on public.plays
  for insert to anon with check (true);

-- Compares each person's first and latest playthrough.
create or replace function public.results_summary()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      lower(trim(nickname)) as who,
      ending,
      row_number() over (partition by lower(trim(nickname)) order by created_at asc, id asc) as first_rank,
      row_number() over (partition by lower(trim(nickname)) order by created_at desc, id desc) as last_rank,
      count(*) over (partition by lower(trim(nickname))) as total
    from plays
  ),
  pairs as (
    select f.ending as before_ending, l.ending as after_ending
    from ranked f
    join ranked l on l.who = f.who and l.last_rank = 1
    where f.first_rank = 1 and f.total >= 2
  )
  select json_build_object(
    'players', (select count(distinct who) from ranked),
    'pairs', (select count(*) from pairs),
    'changed', (select count(*) from pairs where before_ending <> after_ending),
    'before', coalesce((select json_object_agg(ending, n) from (select before_ending as ending, count(*) as n from pairs group by 1) b), '{}'::json),
    'after', coalesce((select json_object_agg(ending, n) from (select after_ending as ending, count(*) as n from pairs group by 1) a), '{}'::json)
  );
$$;

revoke all on function public.results_summary() from public;
grant execute on function public.results_summary() to anon;

-- Each person's first and latest playthrough with their choices, for the goal charts.
-- Names are used only to pair the two plays and are never returned.
create or replace function public.results_plays()
returns json
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      lower(trim(nickname)) as who,
      ending,
      picks,
      gender,
      -- Only the admission year (e.g. '21' from 2021xxxx) leaves the table, never the student ID itself.
      case when student_id ~ '^(19|20)[0-9]{4,}$' then substr(student_id, 3, 2) end as cohort,
      row_number() over (partition by lower(trim(nickname)) order by created_at asc, id asc) as first_rank,
      row_number() over (partition by lower(trim(nickname)) order by created_at desc, id desc) as last_rank,
      count(*) over (partition by lower(trim(nickname))) as total
    from plays
  )
  select coalesce(json_agg(json_build_object(
    'first', json_build_object('ending', f.ending, 'picks', f.picks),
    'last', case when f.total >= 2 then json_build_object('ending', l.ending, 'picks', l.picks) end,
    'gender', coalesce(f.gender, l.gender),
    'cohort', coalesce(f.cohort, l.cohort)
  ) order by random()), '[]'::json)
  from ranked f
  join ranked l on l.who = f.who and l.last_rank = 1
  where f.first_rank = 1;
$$;

revoke all on function public.results_plays() from public;
grant execute on function public.results_plays() to anon;

-- ---------- Presenter page ----------
-- A passphrase guards the presenter actions. Only its salted hash is stored, in a table the public key cannot read.
create table if not exists public.admin_secret (
  id int primary key default 1 check (id = 1),
  salt text not null,
  hash text not null,
  fails int not null default 0,
  locked_until timestamptz
);
alter table public.admin_secret enable row level security;
revoke all on public.admin_secret from anon, authenticated;

-- Plays removed by a reset are kept here so the last reset can be undone.
create table if not exists public.plays_archive (
  run_id text not null,
  nickname text not null,
  ending text not null,
  gauges jsonb not null,
  picks jsonb not null,
  created_at timestamptz not null,
  archived_at timestamptz not null default now()
);
alter table public.plays_archive add column if not exists student_id text;
alter table public.plays_archive add column if not exists gender text;
alter table public.plays_archive enable row level security;
revoke all on public.plays_archive from anon, authenticated;

-- Hand counts taken in class, shown next to the game results.
create table if not exists public.class_state (
  id int primary key default 1 check (id = 1),
  hands_ext int,
  hands_int int,
  updated_at timestamptz
);
alter table public.class_state enable row level security;
revoke all on public.class_state from anon, authenticated;

create or replace function public.admin_hash(salt text, pin text)
returns text language sql immutable as $$
  select encode(sha256(convert_to(salt || pin, 'UTF8')), 'hex');
$$;
revoke all on function public.admin_hash(text, text) from public, anon, authenticated;

-- Checks the passphrase. Five wrong tries lock the page for ten minutes.
create or replace function public.admin_check(pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare s admin_secret;
begin
  select * into s from admin_secret where id = 1 for update;
  if not found then return 'no_pin'; end if;
  if s.locked_until is not null and s.locked_until > now() then return 'locked'; end if;
  if admin_hash(s.salt, coalesce(pin, '')) = s.hash then
    update admin_secret set fails = 0, locked_until = null where id = 1;
    return 'ok';
  end if;
  update admin_secret
    set fails = case when s.fails + 1 >= 5 then 0 else s.fails + 1 end,
        locked_until = case when s.fails + 1 >= 5 then now() + interval '10 minutes' else null end
    where id = 1;
  return 'wrong';
end;
$$;
revoke all on function public.admin_check(text) from public, anon, authenticated;

create or replace function public.admin_status()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object('pin_set', exists (select 1 from admin_secret), 'archived', (select count(*) from plays_archive));
$$;

-- The first visitor to the presenter page sets the passphrase. After that it can only be changed in the SQL Editor.
create or replace function public.admin_init_pin(new_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare s text := gen_random_uuid()::text;
begin
  if char_length(coalesce(new_pin, '')) < 6 then return 'short'; end if;
  insert into admin_secret (id, salt, hash) values (1, s, admin_hash(s, new_pin)) on conflict (id) do nothing;
  if not found then return 'exists'; end if;
  return 'ok';
end;
$$;

-- For the SQL Editor only: select public.admin_set_pin('new passphrase');
create or replace function public.admin_set_pin(new_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare s text := gen_random_uuid()::text;
begin
  if char_length(coalesce(new_pin, '')) < 6 then return 'short'; end if;
  insert into admin_secret (id, salt, hash) values (1, s, admin_hash(s, new_pin))
    on conflict (id) do update set salt = excluded.salt, hash = excluded.hash, fails = 0, locked_until = null;
  return 'ok';
end;
$$;
revoke all on function public.admin_set_pin(text) from public, anon, authenticated;

create or replace function public.admin_reset_plays(pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r text := admin_check(pin); n int;
begin
  if r <> 'ok' then return json_build_object('ok', false, 'error', r); end if;
  -- Supabase blocks DELETE without a WHERE clause on API calls (pg-safeupdate). Clearing every row is the point here.
  with moved as (delete from plays where true returning run_id, nickname, student_id, gender, ending, gauges, picks, created_at)
  insert into plays_archive (run_id, nickname, student_id, gender, ending, gauges, picks, created_at)
  select run_id, nickname, student_id, gender, ending, gauges, picks, created_at from moved;
  get diagnostics n = row_count;
  return json_build_object('ok', true, 'moved', n);
end;
$$;

create or replace function public.admin_restore_plays(pin text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r text := admin_check(pin); latest timestamptz; a plays_archive; n int := 0; skipped int := 0;
begin
  if r <> 'ok' then return json_build_object('ok', false, 'error', r); end if;
  select max(archived_at) into latest from plays_archive;
  if latest is null then return json_build_object('ok', true, 'restored', 0, 'skipped', 0); end if;
  -- A play saved by an older version of the game can break today's rules,
  -- for example with an ending that no longer exists. Skip it instead of failing the whole batch.
  for a in select * from plays_archive where archived_at = latest loop
    begin
      insert into plays (run_id, nickname, student_id, gender, ending, gauges, picks, created_at)
      values (a.run_id, a.nickname, a.student_id, a.gender, a.ending, a.gauges, a.picks, a.created_at)
      on conflict (run_id) do nothing;
      if found then n := n + 1; end if;
    exception when check_violation or not_null_violation then
      skipped := skipped + 1;
    end;
  end loop;
  delete from plays_archive where archived_at = latest;
  return json_build_object('ok', true, 'restored', n, 'skipped', skipped);
end;
$$;

create or replace function public.admin_set_hands(pin text, hands_ext int, hands_int int)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare r text := admin_check(pin);
begin
  if r <> 'ok' then return json_build_object('ok', false, 'error', r); end if;
  insert into class_state (id, hands_ext, hands_int, updated_at) values (1, greatest(hands_ext, 0), greatest(hands_int, 0), now())
    on conflict (id) do update set hands_ext = excluded.hands_ext, hands_int = excluded.hands_int, updated_at = now();
  return json_build_object('ok', true);
end;
$$;

-- Public totals for the results page: play counts and the hand counts.
create or replace function public.results_extra()
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'hands_ext', (select hands_ext from class_state where id = 1),
    'hands_int', (select hands_int from class_state where id = 1),
    'plays', (select count(*) from plays)
  );
$$;

grant execute on function public.admin_status() to anon;
grant execute on function public.admin_init_pin(text) to anon;
grant execute on function public.admin_reset_plays(text) to anon;
grant execute on function public.admin_restore_plays(text) to anon;
grant execute on function public.admin_set_hands(text, int, int) to anon;
grant execute on function public.results_extra() to anon;

-- Lets the presenter page check a passphrase before showing its controls.
create or replace function public.admin_verify(pin text)
returns text language sql security definer set search_path = public as $$
  select admin_check(pin);
$$;
grant execute on function public.admin_verify(text) to anon;
