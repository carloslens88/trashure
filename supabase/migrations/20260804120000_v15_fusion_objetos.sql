-- v15: Evolución/fusión de objetos — 5 unidades iguales se funden en 1 del
-- siguiente escalón. ⚠️ fusion_target debe ser un espejo EXACTO de
-- FUSION_RECIPES en src/game/craft.js: cualquier cambio ahí se replica aquí.

create or replace function public.fusion_target(t text)
returns text
language sql
immutable
as $$
  select case t
    -- Común → Poco común
    when 'lata' then 'radio'
    when 'brik' then 'paraguas'
    when 'periodico' then 'vhs'
    when 'bolsa' then 'osito'
    when 'calcetin' then 'osito'
    when 'vaso' then 'silla'
    when 'caja' then 'silla'
    when 'platano' then 'bota'
    -- Poco común → Raro
    when 'osito' then 'reloj'
    when 'paraguas' then 'brujula'
    when 'radio' then 'camara'
    when 'vhs' then 'camara'
    when 'bota' then 'trompeta'
    when 'silla' then 'llave'
    -- Raro → Épico
    when 'camara' then 'videocamara'
    when 'reloj' then 'orbe'
    when 'trompeta' then 'guitarra'
    when 'llave' then 'mapa'
    when 'brujula' then 'mapa'
    -- Épico → Reliquia
    when 'mapa' then 'anfora'
    when 'orbe' then 'collar'
    when 'guitarra' then 'doblon'
    when 'videocamara' then 'fosil'
    else null
  end;
$$;

-- Funde 5 unidades de `t` (propiedad del jugador, ninguna en venta activa en
-- el mercado) en 1 unidad del siguiente escalón. Todo o nada: si no hay 5
-- disponibles, no se toca nada.
create or replace function public.fuse_items(t text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target text;
  ids bigint[];
begin
  target := fusion_target(t);
  if target is null then
    raise exception 'ese objeto no se puede fusionar';
  end if;

  select array_agg(id) into ids
  from (
    select i.id
    from inventory_items i
    where i.owner = auth.uid()
      and i.type_id = t
      -- los que están en venta activa no cuentan: fundirlos dejaría el
      -- anuncio del mercado apuntando a un objeto que ya no existe
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
