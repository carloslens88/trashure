-- Trashure — actualización v2 (pantalla de Trueques)
-- Pegar en el SQL Editor de Supabase DESPUÉS de schema.sql.

-- Para proponer un trueque necesitas ver el alijo del otro recolector:
-- los inventarios pasan a ser públicos en LECTURA (escribir sigue siendo
-- exclusivo del servidor).
drop policy if exists "inventarios visibles para trueque" on public.inventory_items;
create policy "inventarios visibles para trueque"
  on public.inventory_items for select using (true);

-- Búsquedas de trueques por participante
create index if not exists trades_receiver_idx on public.trades (receiver, status);
create index if not exists trades_proposer_idx on public.trades (proposer, status);
