-- Stores one row per finished playthrough.
-- The public key can add rows and read the totals, but it cannot read individual rows or names.

create table if not exists public.plays (
  id bigint generated always as identity primary key,
  run_id text not null unique check (char_length(run_id) <= 40),
  nickname text not null check (char_length(nickname) between 1 and 20),
  ending text not null check (ending in ('growth', 'passion', 'ease', 'connection', 'balance')),
  gauges jsonb not null,
  picks jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.plays enable row level security;

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
