-- Trashure — v13: ajuste del catálogo (corona/espada desencajaban con el
-- tono postapocalíptico; se retiran del spawn pero no de la base de datos,
-- para no romper inventarios ya existentes — ver items.js).

alter table public.catalog_items add column if not exists retired boolean not null default false;
update public.catalog_items set retired = true where type_id in ('corona', 'espada');

insert into public.catalog_items (type_id, rarity, value, xp) values
  ('guitarra', 'epico', 75, 80),
  ('videocamara', 'epico', 75, 80)
on conflict (type_id) do update
  set rarity = excluded.rarity, value = excluded.value, xp = excluded.xp;

-- set_status/claim_set deben ignorar los retirados o el set épico quedaría
-- incompletable para siempre (nadie puede volver a encontrar corona/espada).
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
  where not c.retired
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
  where c.rarity = r and not c.retired and not exists (
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

  update profiles set scrap = scrap + reward, updated_at = now()
  where id = auth.uid()
  returning scrap into new_scrap;
  return new_scrap;
end;
$$;
