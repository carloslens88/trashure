-- v18: los duelos (100% cliente, sin servidor, para no abrir superficie de
-- trampa en la economía) aportan una contribución PEQUEÑA y con tope diario
-- a la guerra semanal de facciones. Sigue siendo "spoofeable" en teoría
-- (alguien podría llamar al RPC desde la consola sin haber duelado de
-- verdad), pero el tope bajo (5/día, 10 pts cada uno → máx 50 pts/día/
-- jugador) hace que no compense hacer trampa por tan poco frente al resto
-- de la puntuación real (XP de recogidas verificadas en collect_log).

create table if not exists public.duel_points (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  faction text not null,
  week date not null,
  at timestamptz not null default now()
);

create index if not exists duel_points_player_at_idx on public.duel_points (player, at desc);

alter table public.duel_points enable row level security;
drop policy if exists "duelos de guerra visibles" on public.duel_points;
create policy "duelos de guerra visibles" on public.duel_points for select using (true);

-- Se llama tras ganar un duelo en el cliente. Devuelve true si contó para la
-- guerra, false si ya se llegó al tope de hoy (el duelo se gana igual en el
-- cliente, solo deja de sumar puntos a la facción).
create or replace function public.submit_duel_win()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  p_faction text;
  today_count int;
begin
  select faction into p_faction from profiles where id = auth.uid();
  if p_faction is null then
    raise exception 'necesitas una facción para que tus duelos cuenten en la guerra';
  end if;

  select count(*) into today_count
  from duel_points
  where player = auth.uid() and at >= date_trunc('day', now() at time zone 'utc');

  if today_count >= 5 then
    return false;
  end if;

  insert into duel_points (player, faction, week, at)
  values (auth.uid(), p_faction, (date_trunc('week', now() at time zone 'utc'))::date, now());

  return true;
end;
$$;

-- Marcador en vivo: ahora suma XP de recogidas + puntos de duelos (10 c/u)
create or replace function public.war_status()
returns table (faction text, score bigint, reigning boolean)
language sql
stable
security definer
set search_path = public
as $$
  with collect_scores as (
    select p.faction, coalesce(sum(c.xp), 0)::bigint as score
    from collect_log l
    join profiles p on p.id = l.player
    join catalog_items c on c.type_id = l.type_id
    where l.at >= date_trunc('week', now() at time zone 'utc')
      and p.faction is not null
    group by p.faction
  ),
  duel_scores as (
    select faction, (count(*) * 10)::bigint as score
    from duel_points
    where week = (date_trunc('week', now() at time zone 'utc'))::date
    group by faction
  )
  select f.faction,
         coalesce(cs.score, 0) + coalesce(ds.score, 0),
         f.faction = (
           select w.faction from war_winners w
           where w.week = (date_trunc('week', now() at time zone 'utc'))::date
         )
  from (values ('recicladores'), ('anticuarios'), ('contrabandistas')) as f (faction)
  left join collect_scores cs on cs.faction = f.faction
  left join duel_scores ds on ds.faction = f.faction;
$$;

-- Coronación del lunes: mismo cálculo (recogidas + duelos) para que lo que
-- se vio en vivo toda la semana coincida con quién termina coronado.
do $$ begin
  perform cron.unschedule('trashure-war-weekly');
exception when others then null;
end $$;

select cron.schedule(
  'trashure-war-weekly',
  '5 0 * * 1',
  $cron$
  insert into war_winners (week, faction, score)
  select faction, sum(pts) from (
    select p.faction as faction, sum(c.xp) as pts
    from collect_log l
    join profiles p on p.id = l.player
    join catalog_items c on c.type_id = l.type_id
    where l.at >= date_trunc('week', now() at time zone 'utc') - interval '7 days'
      and l.at < date_trunc('week', now() at time zone 'utc')
      and p.faction is not null
    group by p.faction
    union all
    select faction, (count(*) * 10)::bigint as pts
    from duel_points
    where week = (date_trunc('week', now() at time zone 'utc') - interval '7 days')::date
    group by faction
  ) combined
  group by faction
  order by sum(pts) desc
  limit 1
  on conflict (week) do nothing;
  $cron$
);
