-- v14: Núcleo del Desechador — objeto único de TODO el servidor, uno por
-- día. El primero en llegar y recogerlo se lo lleva para siempre: un título
-- exclusivo (imposible de conseguir de otra forma) + recompensa puntual.
-- La localización del día es determinista (mulberry32 sembrado con el día,
-- ver dailyUniqueFor en spawn.js / _shared/spawn.ts) — aquí solo se guarda
-- QUIÉN se lo llevó, no dónde estaba.

create table if not exists public.daily_unique_claims (
  day date primary key,
  claimed_by uuid not null references public.profiles (id) on delete cascade,
  claimed_username text not null,
  claimed_at timestamptz not null default now()
);

alter table public.daily_unique_claims enable row level security;
drop policy if exists "estado del núcleo visible para todos" on public.daily_unique_claims;
create policy "estado del núcleo visible para todos" on public.daily_unique_claims for select using (true);
-- Escribe la edge function collect (service role) al validar la recogida.

create or replace function public.daily_unique_status()
returns table (claimed boolean, claimed_username text)
language sql
stable
security definer
set search_path = public
as $$
  select
    exists(select 1 from daily_unique_claims where day = (now() at time zone 'utc')::date),
    (select claimed_username from daily_unique_claims where day = (now() at time zone 'utc')::date);
$$;

insert into public.titles (id, name, price) values
  ('nucleo', 'Portador del Núcleo', null)
on conflict (id) do update set name = excluded.name, price = excluded.price;

-- Chatarra puntual del Núcleo: solo la concede el servidor (edge function),
-- igual que award_xp — mismo patrón, mismo cuidado: revocar de public
-- también quita el privilegio a service_role, hay que re-grantearlo aparte.
create or replace function public.add_scrap(player uuid, amount int)
returns int
language sql
security definer
set search_path = public
as $$
  update profiles set scrap = scrap + amount, updated_at = now()
  where id = player
  returning scrap;
$$;

revoke execute on function public.add_scrap(uuid, int) from public, anon, authenticated;
grant execute on function public.add_scrap(uuid, int) to service_role;
