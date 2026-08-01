-- Trashure — v11: tras huir de una anomalía se puede reconstruir la racha
-- el mismo día. Antes anomaly_flee dejaba streak=0 con last_day=hoy, y la
-- edge function solo recalcula la racha cuando last_day cambia → quedabas
-- clavado a 0 hasta mañana. Con last_day=null, la siguiente recogida vuelve
-- a arrancar la racha en 1.
create or replace function public.anomaly_flee()
returns void
language sql
security definer
set search_path = public
as $$
  update profiles set streak = 0, last_day = null, updated_at = now() where id = auth.uid();
$$;
