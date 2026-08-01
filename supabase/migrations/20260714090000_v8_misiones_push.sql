-- Trashure — v8: misiones diarias del Gremio + notificaciones push.

-- La rareza de cada recogida queda en el log (las misiones se verifican aquí,
-- porque inventory_items se vacía al vender)
alter table public.collect_log add column if not exists type_id text;

-- ---------- Misiones diarias ----------
create table if not exists public.mission_claims (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  mission_id text not null,
  unique (player, day, mission_id)
);

alter table public.mission_claims enable row level security;
drop policy if exists "cada uno ve sus misiones" on public.mission_claims;
create policy "cada uno ve sus misiones"
  on public.mission_claims for select using (auth.uid() = player);

create or replace function public.mission_status()
returns table (mission_id text, progress int, goal int, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  with today_logs as (
    select l.spawn_id, c.rarity
    from collect_log l
    left join catalog_items c on c.type_id = l.type_id
    where l.player = auth.uid()
      and l.at >= (now() at time zone 'utc')::date
  ),
  claims as (
    select mc.mission_id from mission_claims mc
    where mc.player = auth.uid() and mc.day = (now() at time zone 'utc')::date
  )
  select 'chatarrero', least(count(*)::int, 5), 5,
         'chatarrero' in (select c.mission_id from claims c)
  from today_logs
  union all
  select 'ojo',
         least(count(*) filter (where rarity in ('raro','epico','reliquia','alien'))::int, 1), 1,
         'ojo' in (select c.mission_id from claims c)
  from today_logs
  union all
  select 'rastreador',
         least(count(*) filter (where spawn_id like 'H:%')::int, 1), 1,
         'rastreador' in (select c.mission_id from claims c)
  from today_logs;
$$;

create or replace function public.claim_mission(m text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  reward int;
  done boolean;
  new_scrap int;
begin
  reward := case m
    when 'chatarrero' then 30
    when 'ojo' then 50
    when 'rastreador' then 100
  end;
  if reward is null then
    raise exception 'misión desconocida';
  end if;

  select (ms.progress >= ms.goal) into done
  from mission_status() ms where ms.mission_id = m;
  if not coalesce(done, false) then
    raise exception 'misión incompleta';
  end if;

  begin
    insert into mission_claims (player, mission_id) values (auth.uid(), m);
  exception when unique_violation then
    raise exception 'ya reclamada hoy';
  end;

  update profiles set scrap = scrap + reward, updated_at = now()
  where id = auth.uid() returning scrap into new_scrap;
  return new_scrap;
end;
$$;

-- ---------- Suscripciones push ----------
create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
drop policy if exists "gestiona sus suscripciones" on public.push_subscriptions;
create policy "gestiona sus suscripciones"
  on public.push_subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- Cron diario: avisar de eventos/escondites a las 8:00 UTC ----------
create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$ begin
  perform cron.unschedule('trashure-notify-daily');
exception when others then null;
end $$;

select cron.schedule(
  'trashure-notify-daily',
  '0 8 * * *',
  $cron$
  select net.http_post(
    url := 'https://cecppsvqfytqivfykdhd.supabase.co/functions/v1/notify-events',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlY3Bwc3ZxZnl0cWl2ZnlrZGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3ODczMTMsImV4cCI6MjA5OTM2MzMxM30.nkRbCZ0uViJoZ3uXAGQlaCEOPvQy9aK9Apjz7mx2-r8", "x-notify-secret": "3dfa74ca0f6d9377328cd6c0d6d43cb4295251c911b7befb"}'::jsonb,
    body := '{}'::jsonb
  );
  $cron$
);
