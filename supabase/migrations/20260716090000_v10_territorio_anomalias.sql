-- Trashure — v10: territorio cartografiado (Niebla Tóxica) y anomalías radiactivas.

-- ---------- Territorio cartografiado ----------
-- Sectores (~35 m) despejados de la Niebla Tóxica, acumulado histórico.
-- Lo reporta el cliente (la exploración no pasa por la edge function); es una
-- métrica social, no económica: solo puede crecer y con tope de cordura.
alter table public.profiles add column if not exists explored int not null default 0;

create or replace function public.report_explored(n int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_explored int;
begin
  if n is null or n < 0 or n > 200000 then
    raise exception 'valor de exploración inválido';
  end if;
  update profiles
  set explored = greatest(explored, n), updated_at = now()
  where id = auth.uid()
  returning explored into new_explored;
  return new_explored;
end;
$$;

-- Territorio total por facción: la competición de cartógrafos
create or replace function public.faction_explored()
returns table (faction text, total bigint)
language sql
stable
security definer
set search_path = public
as $$
  select f.faction, coalesce(sum(p.explored), 0)::bigint
  from (values ('recicladores'), ('anticuarios'), ('contrabandistas')) as f (faction)
  left join profiles p on p.faction = f.faction
  group by f.faction;
$$;

-- ---------- Anomalías radiactivas ----------
-- El precio de huir sin recoger: la radiación borra tu racha diaria.
-- Lo invoca el cliente al salir del radio; solo afecta a tu propio perfil.
create or replace function public.anomaly_flee()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set streak = 0, updated_at = now() where id = auth.uid();
$$;
