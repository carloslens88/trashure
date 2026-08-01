-- Trashure — v12: el Reclamador (jefe de zona cooperativo semanal) y el
-- Campamento propio con suministros diarios.

-- ---------- Campamento ----------
alter table public.profiles add column if not exists camp_lat double precision;
alter table public.profiles add column if not exists camp_lng double precision;
alter table public.profiles add column if not exists camp_moved_at timestamptz;
alter table public.profiles add column if not exists camp_claim_day date;

create or replace function public.haversine_m(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
as $$
  select 2 * 6371000 * asin(sqrt(
    pow(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) * pow(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

create or replace function public.set_camp(p_lat double precision, p_lng double precision)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  moved timestamptz;
begin
  select camp_moved_at into moved from profiles where id = auth.uid();
  if moved is not null and now() - moved < interval '7 days' then
    raise exception 'el campamento solo puede mudarse cada 7 días';
  end if;
  update profiles
  set camp_lat = p_lat, camp_lng = p_lng, camp_moved_at = now(), updated_at = now()
  where id = auth.uid();
end;
$$;

-- Suministros diarios: hay que estar físicamente en el campamento.
create or replace function public.claim_camp(p_lat double precision, p_lng double precision)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  c_lat double precision;
  c_lng double precision;
  c_day date;
  new_scrap int;
begin
  select camp_lat, camp_lng, camp_claim_day into c_lat, c_lng, c_day
  from profiles where id = auth.uid();
  if c_lat is null then
    raise exception 'no tienes campamento';
  end if;
  if c_day = (now() at time zone 'utc')::date then
    raise exception 'suministros ya recogidos hoy';
  end if;
  if haversine_m(p_lat, p_lng, c_lat, c_lng) > 120 then
    raise exception 'demasiado lejos de tu campamento';
  end if;
  update profiles
  set scrap = scrap + 30, camp_claim_day = (now() at time zone 'utc')::date, updated_at = now()
  where id = auth.uid()
  returning scrap into new_scrap;
  return new_scrap;
end;
$$;

-- ---------- El Reclamador (jefe de zona, ~2 km, semanal) ----------
create table if not exists public.boss_damage (
  id bigint generated always as identity primary key,
  region text not null,
  week date not null,
  player uuid not null references public.profiles (id) on delete cascade,
  damage int not null,
  at timestamptz not null default now()
);

create index if not exists boss_damage_region_idx on public.boss_damage (region, week);

alter table public.boss_damage enable row level security;
-- Escribe la edge function (service role); se lee vía boss_status.

create table if not exists public.boss_claims (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  region text not null,
  week date not null,
  unique (player, region, week)
);

alter table public.boss_claims enable row level security;
drop policy if exists "cada uno ve sus botines" on public.boss_claims;
create policy "cada uno ve sus botines" on public.boss_claims for select using (auth.uid() = player);

create or replace function public.boss_region(p_lat double precision, p_lng double precision)
returns text
language sql
immutable
as $$
  select floor(p_lng / 0.02)::text || ':' || floor(p_lat / 0.02)::text;
$$;

create or replace function public.boss_status(p_lat double precision, p_lng double precision)
returns table (hp_goal int, hp_done bigint, my_damage bigint, participants bigint, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  select 1000,
         coalesce(sum(d.damage), 0)::bigint,
         coalesce(sum(d.damage) filter (where d.player = auth.uid()), 0)::bigint,
         count(distinct d.player)::bigint,
         exists (
           select 1 from boss_claims c
           where c.player = auth.uid()
             and c.region = boss_region(p_lat, p_lng)
             and c.week = (date_trunc('week', now() at time zone 'utc'))::date
         )
  from boss_damage d
  where d.region = boss_region(p_lat, p_lng)
    and d.week = (date_trunc('week', now() at time zone 'utc'))::date;
$$;

create or replace function public.claim_boss(p_lat double precision, p_lng double precision)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  region_key text := boss_region(p_lat, p_lng);
  wk date := (date_trunc('week', now() at time zone 'utc'))::date;
  total bigint;
  mine bigint;
  new_scrap int;
begin
  select coalesce(sum(damage), 0),
         coalesce(sum(damage) filter (where player = auth.uid()), 0)
  into total, mine
  from boss_damage where region = region_key and week = wk;

  if total < 1000 then
    raise exception 'el Reclamador sigue en pie';
  end if;
  if mine <= 0 then
    raise exception 'no participaste en esta batalla';
  end if;

  begin
    insert into boss_claims (player, region, week) values (auth.uid(), region_key, wk);
  exception when unique_violation then
    raise exception 'botín ya reclamado';
  end;

  update profiles set scrap = scrap + 300, updated_at = now()
  where id = auth.uid()
  returning scrap into new_scrap;
  return new_scrap;
end;
$$;
