-- Trashure — v4: economía autoritativa.
-- El servidor manda sobre XP y Chatarra: el catálogo de valores vive en BD,
-- vender es un RPC y los clientes ya no pueden escribir su progreso.

-- ---------- Catálogo (autoridad sobre valores y XP) ----------
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
