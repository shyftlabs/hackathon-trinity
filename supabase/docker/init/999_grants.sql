-- ============================================================
-- 999 grants: ensure every table/sequence created by the
-- migrations is reachable by the PostgREST roles. Runs last.
-- ============================================================
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- PostgREST caches the schema; nudge it to reload on next request.
notify pgrst, 'reload schema';
