-- v16: la fusión de objetos ahora varía según la facción del jugador — mismo
-- input, resultado distinto. ⚠️ Debe ser un espejo EXACTO de
-- NEXT_TIER/TIER_OF/BASE_INDEX/FACTION_OFFSET en src/game/craft.js.

create or replace function public.fusion_target(t text, p_faction text default null)
returns text
language plpgsql
stable
as $$
declare
  tier text;
  pool text[];
  base_idx int;
  faction_offset int;
  idx int;
begin
  tier := case t
    when 'lata' then 'comun'
    when 'brik' then 'comun'
    when 'periodico' then 'comun'
    when 'bolsa' then 'comun'
    when 'calcetin' then 'comun'
    when 'vaso' then 'comun'
    when 'caja' then 'comun'
    when 'platano' then 'comun'
    when 'osito' then 'pocoComun'
    when 'paraguas' then 'pocoComun'
    when 'radio' then 'pocoComun'
    when 'vhs' then 'pocoComun'
    when 'bota' then 'pocoComun'
    when 'silla' then 'pocoComun'
    when 'camara' then 'raro'
    when 'reloj' then 'raro'
    when 'trompeta' then 'raro'
    when 'llave' then 'raro'
    when 'brujula' then 'raro'
    when 'mapa' then 'epico'
    when 'orbe' then 'epico'
    when 'guitarra' then 'epico'
    when 'videocamara' then 'epico'
    else null
  end;
  if tier is null then
    return null;
  end if;

  pool := case tier
    when 'comun' then array['radio', 'paraguas', 'vhs', 'osito', 'silla', 'bota']
    when 'pocoComun' then array['reloj', 'brujula', 'camara', 'trompeta', 'llave']
    when 'raro' then array['videocamara', 'orbe', 'guitarra', 'mapa']
    when 'epico' then array['anfora', 'collar', 'doblon', 'fosil']
  end;

  base_idx := case t
    when 'lata' then 0
    when 'brik' then 1
    when 'periodico' then 2
    when 'bolsa' then 3
    when 'calcetin' then 3
    when 'vaso' then 4
    when 'caja' then 4
    when 'platano' then 5
    when 'osito' then 0
    when 'paraguas' then 1
    when 'radio' then 2
    when 'vhs' then 2
    when 'bota' then 3
    when 'silla' then 4
    when 'camara' then 0
    when 'reloj' then 1
    when 'trompeta' then 2
    when 'llave' then 3
    when 'brujula' then 3
    when 'mapa' then 0
    when 'orbe' then 1
    when 'guitarra' then 2
    when 'videocamara' then 3
  end;

  faction_offset := case p_faction
    when 'recicladores' then 0
    when 'anticuarios' then 1
    when 'contrabandistas' then 2
    else 0
  end;

  idx := (base_idx + faction_offset) % array_length(pool, 1);
  return pool[idx + 1]; -- los arrays de Postgres empiezan en 1
end;
$$;

create or replace function public.fuse_items(t text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  p_faction text;
  target text;
  ids bigint[];
begin
  select faction into p_faction from profiles where id = auth.uid();
  target := fusion_target(t, p_faction);
  if target is null then
    raise exception 'ese objeto no se puede fusionar';
  end if;

  select array_agg(id) into ids
  from (
    select i.id
    from inventory_items i
    where i.owner = auth.uid()
      and i.type_id = t
      and not exists (
        select 1 from market_listings m
        where m.item_id = i.id and m.status = 'active'
      )
    limit 5
  ) sub;

  if coalesce(array_length(ids, 1), 0) < 5 then
    raise exception 'necesitas 5 unidades libres de ese objeto para fusionar';
  end if;

  delete from inventory_items where id = any (ids);

  insert into inventory_items (owner, collector, type_id, spawn_id)
  values (
    auth.uid(),
    auth.uid(),
    target,
    'F:' || extract(epoch from clock_timestamp())::bigint || ':' || floor(random() * 1000000)::text
  );

  return target;
end;
$$;
