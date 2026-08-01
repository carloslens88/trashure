-- Trashure — Fase 2 (esquema completo para instalaciones nuevas; ya incluye
-- los cambios de schema-v2.sql y schema-v3.sql).
-- Para una BD ya creada, usa las migraciones: `npx supabase db push`.

-- ---------- Perfiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  xp int not null default 0,
  scrap int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "perfiles visibles para todos"
  on public.profiles for select using (true);

create policy "cada uno crea su perfil"
  on public.profiles for insert with check (auth.uid() = id);

create policy "cada uno edita su perfil"
  on public.profiles for update using (auth.uid() = id);

-- ---------- Inventario ----------
create table if not exists public.inventory_items (
  id bigint generated always as identity primary key,
  owner uuid not null references public.profiles (id) on delete cascade,
  -- quién lo recogió originalmente (inmutable; owner cambia con los trueques)
  collector uuid not null references public.profiles (id) on delete cascade,
  type_id text not null,
  spawn_id text not null,
  collected_at timestamptz not null default now(),
  -- un mismo spawn no se puede recoger dos veces por el mismo jugador
  unique (collector, spawn_id)
);

create index if not exists inventory_items_owner_idx on public.inventory_items (owner);

alter table public.inventory_items enable row level security;

-- lectura pública: hace falta ver el alijo del otro para proponer un trueque
create policy "inventarios visibles para trueque"
  on public.inventory_items for select using (true);

-- Las inserciones las hace SOLO la edge function `collect` (service role),
-- que valida posición y spawn. Sin política de insert para usuarios.

-- ---------- Registro de recogidas (anti-cheat: velocidad, patrones) ----------
create table if not exists public.collect_log (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  spawn_id text not null,
  lat double precision not null,
  lng double precision not null,
  at timestamptz not null default now()
);

create index if not exists collect_log_player_at_idx on public.collect_log (player, at desc);

alter table public.collect_log enable row level security;
-- Solo el servidor escribe/lee este registro: sin políticas para usuarios.

-- ---------- Trades (trueque entre jugadores) ----------
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  proposer uuid not null references public.profiles (id),
  receiver uuid not null references public.profiles (id),
  proposer_items bigint[] not null default '{}',
  receiver_items bigint[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (proposer <> receiver)
);

alter table public.trades enable row level security;

create policy "los implicados ven el trade"
  on public.trades for select using (auth.uid() in (proposer, receiver));

create policy "cualquiera propone un trade"
  on public.trades for insert with check (auth.uid() = proposer);

-- Aceptación atómica: intercambia la propiedad de los objetos de golpe.
create or replace function public.accept_trade(trade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  t trades%rowtype;
begin
  select * into t from trades where id = trade_id for update;

  if t.id is null then
    raise exception 'trade no encontrado';
  end if;
  if t.status <> 'pending' then
    raise exception 'trade ya resuelto';
  end if;
  if auth.uid() <> t.receiver then
    raise exception 'solo el receptor puede aceptar';
  end if;

  -- Verificar que cada parte sigue siendo dueña de lo que ofrece
  if exists (
    select 1 from unnest(t.proposer_items) as item_id
    where not exists (
      select 1 from inventory_items i where i.id = item_id and i.owner = t.proposer
    )
  ) or exists (
    select 1 from unnest(t.receiver_items) as item_id
    where not exists (
      select 1 from inventory_items i where i.id = item_id and i.owner = t.receiver
    )
  ) then
    update trades set status = 'cancelled', resolved_at = now() where id = trade_id;
    raise exception 'los objetos ofrecidos ya no están disponibles';
  end if;

  update inventory_items set owner = t.receiver where id = any (t.proposer_items);
  update inventory_items set owner = t.proposer where id = any (t.receiver_items);
  update trades set status = 'accepted', resolved_at = now() where id = trade_id;
end;
$$;

create or replace function public.reject_trade(trade_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update trades
  set status = case when auth.uid() = proposer then 'cancelled' else 'rejected' end,
      resolved_at = now()
  where id = trade_id
    and status = 'pending'
    and auth.uid() in (proposer, receiver);
end;
$$;

-- ---------- Economía autoritativa (v4/v5) ----------
-- Catálogo de valores, venta vía RPC y XP concedido solo por el servidor.
-- (Contenido idéntico a las migraciones v4 y v5.)
create table if not exists public.catalog_items (
  type_id text primary key,
  rarity text not null,
  value int not null,
  xp int not null
);

alter table public.catalog_items enable row level security;
drop policy if exists "catalogo publico" on public.catalog_items;
create policy "catalogo publico" on public.catalog_items for select using (true);

insert into public.catalog_items (type_id, rarity, value, xp) values
  ('lata', 'comun', 2, 5),
  ('brik', 'comun', 2, 5),
  ('periodico', 'comun', 2, 5),
  ('bolsa', 'comun', 2, 5),
  ('vaso', 'comun', 2, 5),
  ('platano', 'comun', 2, 5),
  ('calcetin', 'comun', 2, 5),
  ('caja', 'comun', 2, 5),
  ('osito', 'pocoComun', 6, 12),
  ('paraguas', 'pocoComun', 6, 12),
  ('radio', 'pocoComun', 6, 12),
  ('bota', 'pocoComun', 6, 12),
  ('vhs', 'pocoComun', 6, 12),
  ('silla', 'pocoComun', 6, 12),
  ('camara', 'raro', 20, 30),
  ('reloj', 'raro', 20, 30),
  ('trompeta', 'raro', 20, 30),
  ('llave', 'raro', 20, 30),
  ('brujula', 'raro', 20, 30),
  ('mapa', 'epico', 75, 80),
  ('corona', 'epico', 75, 80),
  ('orbe', 'epico', 75, 80),
  ('espada', 'epico', 75, 80),
  ('anfora', 'reliquia', 300, 200),
  ('doblon', 'reliquia', 300, 200),
  ('fosil', 'reliquia', 300, 200),
  ('collar', 'reliquia', 300, 200),
  ('nave', 'alien', 1500, 500),
  ('plasma', 'alien', 1500, 500),
  ('anomalia', 'alien', 1500, 500),
  ('huevo', 'alien', 1500, 500)
on conflict (type_id) do update
  set rarity = excluded.rarity, value = excluded.value, xp = excluded.xp;

-- ---------- Los jugadores solo pueden escribir su username ----------
revoke insert, update on table public.profiles from anon, authenticated;
grant insert (id, username), update (id, username) on table public.profiles to authenticated;

-- ---------- XP: solo lo concede el servidor (edge function) ----------
create or replace function public.award_xp(player uuid, amount int)
returns int
language sql
security definer
set search_path = public
as $$
  update profiles set xp = xp + amount, updated_at = now()
  where id = player
  returning xp;
$$;

revoke execute on function public.award_xp(uuid, int) from public, anon, authenticated;

-- ---------- Vender al Gremio ----------
create or replace function public.sell_item(item_id bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  item_value int;
  new_scrap int;
begin
  select c.value into item_value
  from inventory_items i
  join catalog_items c on c.type_id = i.type_id
  where i.id = item_id and i.owner = auth.uid();

  if item_value is null then
    raise exception 'objeto no disponible';
  end if;

  delete from inventory_items where id = item_id;

  update profiles set scrap = scrap + item_value, updated_at = now()
  where id = auth.uid()
  returning scrap into new_scrap;

  return new_scrap;
end;
$$;
grant execute on function public.award_xp(uuid, int) to service_role;
