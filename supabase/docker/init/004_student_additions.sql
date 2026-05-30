-- ============================================================
-- Migration 003: Student additions
-- Owner: Student developer
-- Run AFTER 002_teacher_tables.sql
-- ============================================================

-- Flashcards (generated per student per topic)
create table if not exists flashcards (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null references students(id) on delete cascade,
  topic       text not null,
  cards       jsonb not null default '[]',   -- [{front, back}]
  created_at  timestamptz not null default now()
);
create index if not exists flashcards_student_topic on flashcards(student_id, topic);

-- join_code on classrooms so students can join by short code
-- Om: populate this in create_classroom() e.g. secrets.token_urlsafe(6).upper()
alter table classrooms add column if not exists join_code text unique;
create index if not exists classrooms_join_code on classrooms(join_code);
