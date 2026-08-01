-- Trashure — v9: racha diaria, sets del catálogo, títulos y guerra semanal.

-- ---------- Racha y título equipado ----------
alter table public.profiles add column if not exists streak int not null default 0;
alter table public.profiles add column if not exists last_day date;
alter table public.profiles add column if not exists title text;

-- ---------- Títulos ----------
create table if not exists public.titles (
  id text primary key,
  name text not null,
  price int -- null = solo por logro
);

alter table public.titles enable row level security;
drop policy if exists "titulos publicos" on public.titles;
create policy "titulos publicos" on public.titles for select using (true);

insert into public.titles (id, name, price) values
  ('barrendero', 'Barrendero del Yermo', null),
  ('ropavejero', 'Ropavejero', null),
  ('ojo_halcon', 'Ojo de Halcón', null),
  ('cazatesoros', 'Cazatesoros', null),
  ('anticuario_legendario', 'Anticuario Legendario', null),
  ('amigo_desechadores', 'Amigo de los Desechadores', null),
  ('superviviente', 'Superviviente', 50),
  ('rata_yermo', 'Rata del Yermo', 200),
  ('magnate', 'Magnate de la Chatarra', 1000),
  ('leyenda', 'Leyenda del Páramo', 5000)
on conflict (id) do update set name = excluded.name, price = excluded.price;

create table if not exists public.player_titles (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  title_id text not null references public.titles (id),
  unique (player, title_id)
);

alter table public.player_titles enable row level security;
drop policy if exists "titulos de jugador visibles" on public.player_titles;
create policy "titulos de jugador visibles" on public.player_titles for select using (true);

create or replace function public.buy_title(t text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  title_price int;
  new_scrap int;
begin
  select price into title_price from titles where id = t;
  if title_price is null then
    raise exception 'ese título no está en venta';
  end if;

  update profiles set scrap = scrap - title_price, updated_at = now()
  where id = auth.uid() and scrap >= title_price
  returning scrap into new_scrap;
  if new_scrap is null then
    raise exception 'no tienes suficiente Chatarra';
  end if;

  begin
    insert into player_titles (player, title_id) values (auth.uid(), t);
  exception when unique_violation then
    raise exception 'ya tienes ese título';
  end;

  return new_scrap;
end;
$$;

create or replace function public.equip_title(t text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if t is not null and not exists (
    select 1 from player_titles where player = auth.uid() and title_id = t
  ) then
    raise exception 'no tienes ese título';
  end if;
  update profiles set title = t, updated_at = now() where id = auth.uid();
end;
$$;

-- ---------- Sets del catálogo ----------
create table if not exists public.set_claims (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  rarity text not null,
  claimed_at timestamptz not null default now(),
  unique (player, rarity)
);

alter table public.set_claims enable row level security;
drop policy if exists "cada uno ve sus sets" on public.set_claims;
create policy "cada uno ve sus sets" on public.set_claims for select using (auth.uid() = player);

create or replace function public.set_status()
returns table (rarity text, collected int, total int, claimed boolean)
language sql
stable
security definer
set search_path = public
as $$
  with mine as (
    select distinct type_id from collect_log
    where player = auth.uid() and type_id is not null
  )
  select c.rarity,
         count(m.type_id)::int,
         count(*)::int,
         exists (select 1 from set_claims s where s.player = auth.uid() and s.rarity = c.rarity)
  from catalog_items c
  left join mine m on m.type_id = c.type_id
  group by c.rarity;
$$;

create or replace function public.claim_set(r text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  reward int;
  title_id text;
  missing int;
  new_scrap int;
begin
  select case r
    when 'comun' then 100 when 'pocoComun' then 150 when 'raro' then 300
    when 'epico' then 600 when 'reliquia' then 1500 when 'alien' then 5000
  end,
  case r
    when 'comun' then 'barrendero' when 'pocoComun' then 'ropavejero'
    when 'raro' then 'ojo_halcon' when 'epico' then 'cazatesoros'
    when 'reliquia' then 'anticuario_legendario' when 'alien' then 'amigo_desechadores'
  end
  into reward, title_id;
  if reward is null then
    raise exception 'set desconocido';
  end if;

  select count(*) into missing
  from catalog_items c
  where c.rarity = r and not exists (
    select 1 from collect_log l
    where l.player = auth.uid() and l.type_id = c.type_id
  );
  if missing > 0 then
    raise exception 'set incompleto: faltan % objetos', missing;
  end if;

  begin
    insert into set_claims (player, rarity) values (auth.uid(), r);
  exception when unique_violation then
    raise exception 'set ya reclamado';
  end;

  insert into player_titles (player, title_id) values (auth.uid(), title_id)
  on conflict (player, title_id) do nothing;

  update profiles set scrap = scrap + reward, updated_at = now()
  where id = auth.uid() returning scrap into new_scrap;
  return new_scrap;
end;
$$;

-- ---------- Guerra semanal ----------
create table if not exists public.war_winners (
  week date primary key,
  faction text not null,
  score bigint not null default 0
);

alter table public.war_winners enable row level security;
drop policy if exists "palmares publico" on public.war_winners;
create policy "palmares publico" on public.war_winners for select using (true);

-- Marcador en vivo de la semana + campeón reinante (decidido el lunes)
create or replace function public.war_status()
returns table (faction text, score bigint, reigning boolean)
language sql
stable
security definer
set search_path = public
as $$
  with scores as (
    select p.faction, coalesce(sum(c.xp), 0)::bigint as score
    from collect_log l
    join profiles p on p.id = l.player
    join catalog_items c on c.type_id = l.type_id
    where l.at >= date_trunc('week', now() at time zone 'utc')
      and p.faction is not null
    group by p.faction
  )
  select f.faction,
         coalesce(s.score, 0),
         f.faction = (
           select w.faction from war_winners w
           where w.week = (date_trunc('week', now() at time zone 'utc'))::date
         )
  from (values ('recicladores'), ('anticuarios'), ('contrabandistas')) as f (faction)
  left join scores s on s.faction = f.faction;
$$;

-- Coronación: cada lunes a las 00:05 UTC se corona a la facción con más XP
-- de recogidas de la semana anterior. El campeón reinante cobra +10 % de XP
-- toda la semana (lo aplica la edge function `collect`).
do $$ begin
  perform cron.unschedule('trashure-war-weekly');
exception when others then null;
end $$;

select cron.schedule(
  'trashure-war-weekly',
  '5 0 * * 1',
  $cron$
  insert into war_winners (week, faction, score)
  select (date_trunc('week', now() at time zone 'utc'))::date, p.faction, sum(c.xp)
  from collect_log l
  join profiles p on p.id = l.player
  join catalog_items c on c.type_id = l.type_id
  where l.at >= date_trunc('week', now() at time zone 'utc') - interval '7 days'
    and l.at < date_trunc('week', now() at time zone 'utc')
    and p.faction is not null
  group by p.faction
  order by sum(c.xp) desc
  limit 1
  on conflict (week) do nothing;
  $cron$
);
