-- v5: al revocar EXECUTE de `public` en award_xp, el service_role (la edge
-- function) también lo perdió. Restaurárselo solo a él.
grant execute on function public.award_xp(uuid, int) to service_role;
