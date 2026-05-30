-- ============================================================
-- 000 bootstrap: extensions, Supabase roles, and the two tables
-- involved in the students <-> teachers circular FK.
-- Runs before the copied migration files (alphabetical order).
-- ============================================================

create extension if not exists pgcrypto;

-- ── Supabase-style roles PostgREST authenticates as ──────────────────────────
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then
    create role authenticator noinherit login password 'postgres';
  end if;
end
$$;

grant anon, authenticated, service_role to authenticator;
grant usage on schema public to anon, authenticated, service_role;

-- New tables created later in this init run inherit these grants automatically.
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on functions to anon, authenticated, service_role;

-- ── Shared trigger function ──────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

-- ── Break the circular FK: create teachers then students up front ────────────
create table if not exists teachers (
  id           text primary key,
  email        text unique not null,
  name         text not null default '',
  institution  text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists students (
  id            text primary key,
  email         text unique,
  name          text not null default '',
  teacher_id    text references teachers(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
