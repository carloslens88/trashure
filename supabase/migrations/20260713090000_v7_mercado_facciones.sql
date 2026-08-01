-- Trashure — v7: facciones y mercado entre jugadores.
-- Toda la economía sigue siendo del servidor: listar, comprar y los perks de
-- facción se resuelven en RPCs security definer.

-- ---------- Facciones ----------
alter table public.profiles add column if not exists faction text
  check (faction in ('recicladores', 'anticuarios', 'contrabandistas'));

-- Elegir facción es una decisión única (evita el baile de perks).
create or replace function public.join_faction(f text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if f not in ('recicladores', 'anticuarios', 'contrabandistas') then
    raise exception 'facción desconocida';
  end if;
  update profiles set faction = f, updated_at = now()
  where id = auth.uid() and faction is null;
  if not found then
    raise exception 'ya perteneces a una facción';
  end if;
end;
$$;

-- Guerra de facciones: XP total y miembros por facción.
create or replace function public.faction_totals()
returns table (faction text, total_xp bigint, members bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.faction, coalesce(sum(p.xp), 0), count(*)
  from profiles p
  where p.faction is not null
  group by p.faction;
$$;

-- ---------- Mercado ----------
create table if not exists public.market_listings (
  id uuid primary key default gen_random_uuid(),
  seller uuid not null references public.profiles (id) on delete cascade,
  item_id bigint not null references public.inventory_items (id) on delete cascade,
  price int not null check (price > 0),
  status text not null default 'active'
    check (status in ('active', 'sold', 'cancelled')),
  sold_to uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- un objeto solo puede tener un anuncio activo
create unique index if not exists market_active_item_uq
  on public.market_listings (item_id) where status = 'active';
create index if not exists market_status_idx
  on public.market_listings (status, created_at desc);

alter table public.market_listings enable row level security;

drop policy if exists "mercado visible" on public.market_listings;
create policy "mercado visible"
  on public.market_listings for select using (true);
-- Escrituras solo vía RPCs.

create or replace function public.list_item(p_item bigint, p_price int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  listing_id uuid;
begin
  if p_price < 1 or p_price > 1000000 then
    raise exception 'precio inválido';
  end if;
  if not exists (
    select 1 from inventory_items where id = p_item and owner = auth.uid()
  ) then
    raise exception 'ese objeto no es tuyo';
  end if;
  insert into market_listings (seller, item_id, price)
  values (auth.uid(), p_item, p_price)
  returning id into listing_id;
  return listing_id;
exception
  when unique_violation then
    raise exception 'ese objeto ya está en venta';
end;
$$;

create or replace function public.cancel_listing(p_listing uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update market_listings set status = 'cancelled', resolved_at = now()
  where id = p_listing and seller = auth.uid() and status = 'active';
  if not found then
    raise exception 'anuncio no disponible';
  end if;
end;
$$;

-- Comprar: cobra al comprador, paga al vendedor (menos la tasa del Gremio,
-- que se quema: sumidero anti-inflación), transfiere el objeto.
-- Contrabandistas venden con tasa reducida (5 % vs 10 %).
create or replace function public.buy_item(p_listing uuid)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  l market_listings%rowtype;
  seller_faction text;
  fee int;
  buyer_scrap int;
begin
  select * into l from market_listings where id = p_listing for update;

  if l.id is null or l.status <> 'active' then
    raise exception 'anuncio no disponible';
  end if;
  if l.seller = auth.uid() then
    raise exception 'no puedes comprarte a ti mismo';
  end if;
  -- ¿el vendedor sigue teniendo el objeto? (pudo tradearlo)
  if not exists (
    select 1 from inventory_items where id = l.item_id and owner = l.seller
  ) then
    update market_listings set status = 'cancelled', resolved_at = now() where id = l.id;
    raise exception 'el objeto ya no está disponible';
  end if;

  select scrap into buyer_scrap from profiles where id = auth.uid() for update;
  if buyer_scrap is null or buyer_scrap < l.price then
    raise exception 'no tienes suficiente Chatarra';
  end if;

  select faction into seller_faction from profiles where id = l.seller;
  fee := floor(l.price * (case when seller_faction = 'contrabandistas' then 0.05 else 0.10 end));

  update profiles set scrap = scrap - l.price, updated_at = now()
    where id = auth.uid() returning scrap into buyer_scrap;
  update profiles set scrap = scrap + (l.price - fee), updated_at = now()
    where id = l.seller;
  update inventory_items set owner = auth.uid() where id = l.item_id;
  update market_listings
    set status = 'sold', sold_to = auth.uid(), resolved_at = now()
    where id = l.id;

  return buyer_scrap;
end;
$$;

-- ---------- Perk de Recicladores en la venta al Gremio ----------
-- +25 % (redondeo a favor del jugador) vendiendo comunes y poco comunes.
create or replace function public.sell_item(item_id bigint)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  item_value int;
  item_rarity text;
  player_faction text;
  new_scrap int;
begin
  select c.value, c.rarity into item_value, item_rarity
  from inventory_items i
  join catalog_items c on c.type_id = i.type_id
  where i.id = item_id and i.owner = auth.uid();

  if item_value is null then
    raise exception 'objeto no disponible';
  end if;

  select faction into player_faction from profiles where id = auth.uid();
  if player_faction = 'recicladores' and item_rarity in ('comun', 'pocoComun') then
    item_value := item_value + ceil(item_value * 0.25);
  end if;

  delete from inventory_items where id = item_id;

  update profiles set scrap = scrap + item_value, updated_at = now()
  where id = auth.uid()
  returning scrap into new_scrap;

  return new_scrap;
end;
$$;
