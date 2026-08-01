-- Trashure — v3: arregla los trueques de copias del mismo spawn.
-- Dos jugadores pueden recoger legítimamente el mismo spawn (cada uno su
-- copia); la unicidad debe impedir recoger dos veces, no poseer dos copias.
-- `collector` = quién lo recogió (inmutable); `owner` cambia con los trueques.

alter table public.inventory_items add column if not exists collector uuid;
update public.inventory_items set collector = owner where collector is null;
alter table public.inventory_items alter column collector set not null;

alter table public.inventory_items
  drop constraint if exists inventory_items_owner_spawn_id_key;
create unique index if not exists inventory_collector_spawn_uq
  on public.inventory_items (collector, spawn_id);
