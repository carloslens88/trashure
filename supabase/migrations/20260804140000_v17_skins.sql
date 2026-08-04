-- v17: skins cosméticas para el robot, compradas con Chatarra. Mismo patrón
-- que titles/player_titles (buy_title/equip_title) — sin efecto en la
-- economía core, solo apariencia. 3 son exclusivas de una facción.

create table if not exists public.skins (
  id text primary key,
  name text not null,
  price int not null,
  faction text -- null = cualquiera puede comprarla; si no, solo esa facción
);

alter table public.skins enable row level security;
drop policy if exists "skins publicas" on public.skins;
create policy "skins publicas" on public.skins for select using (true);

insert into public.skins (id, name, price, faction) values
  ('oxidado', 'Chatarra Vieja', 50, null),
  ('sombra', 'Modelo Sombra', 300, null),
  ('radiactivo', 'Núcleo Filtrado', 400, null),
  ('dorado', 'Chapado en Oro', 500, null),
  ('arcoiris', 'Prisma', 800, null),
  ('recicladores_skin', 'Chapa de Reciclaje', 150, 'recicladores'),
  ('anticuarios_skin', 'Pátina Dorada', 150, 'anticuarios'),
  ('contrabandistas_skin', 'Camuflaje Furtivo', 150, 'contrabandistas')
on conflict (id) do update
  set name = excluded.name, price = excluded.price, faction = excluded.faction;

create table if not exists public.player_skins (
  id bigint generated always as identity primary key,
  player uuid not null references public.profiles (id) on delete cascade,
  skin_id text not null references public.skins (id),
  unique (player, skin_id)
);

alter table public.player_skins enable row level security;
drop policy if exists "skins de jugador visibles" on public.player_skins;
create policy "skins de jugador visibles" on public.player_skins for select using (true);

alter table public.profiles add column if not exists skin text references public.skins (id);

create or replace function public.buy_skin(s text)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  skin_price int;
  skin_faction text;
  player_faction text;
  new_scrap int;
begin
  select price, faction into skin_price, skin_faction from skins where id = s;
  if skin_price is null then
    raise exception 'esa skin no existe';
  end if;

  if skin_faction is not null then
    select faction into player_faction from profiles where id = auth.uid();
    if player_faction is distinct from skin_faction then
      raise exception 'esa skin es exclusiva de otra facción';
    end if;
  end if;

  update profiles set scrap = scrap - skin_price, updated_at = now()
  where id = auth.uid() and scrap >= skin_price
  returning scrap into new_scrap;
  if new_scrap is null then
    raise exception 'no tienes suficiente Chatarra';
  end if;

  begin
    insert into player_skins (player, skin_id) values (auth.uid(), s);
  exception when unique_violation then
    raise exception 'ya tienes esa skin';
  end;

  return new_scrap;
end;
$$;

create or replace function public.equip_skin(s text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if s is not null and not exists (
    select 1 from player_skins where player = auth.uid() and skin_id = s
  ) then
    raise exception 'no tienes esa skin';
  end if;
  update profiles set skin = s, updated_at = now() where id = auth.uid();
end;
$$;
