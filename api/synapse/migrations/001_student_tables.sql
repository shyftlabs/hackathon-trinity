-- ============================================================
-- Migration 001: Student tables
-- Owner: Student developer
-- Run via: supabase db push  OR  psql -f this file
-- ============================================================

-- Students
create table if not exists students (
  id            text primary key,
  email         text unique,
  name          text not null default '',
  teacher_id    text references teachers(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Knowledge Maps (one per student, upserted after each diagnostic/assessment)
create table if not exists knowledge_maps (
  id             uuid primary key default gen_random_uuid(),
  student_id     text not null references students(id) on delete cascade,
  topics         jsonb not null default '[]',   -- [{topic, level, evidence}]
  overall_mastery float not null default 0.0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists knowledge_maps_student_idx on knowledge_maps(student_id);

-- Quiz Sessions (stores generated quiz so correct answers survive to evaluation)
create table if not exists quiz_sessions (
  id          uuid primary key default gen_random_uuid(),
  student_id  text not null references students(id) on delete cascade,
  topics      text[] not null default '{}',
  quiz        jsonb not null,   -- full DiagnosticQuiz JSON including correct_label
  created_at  timestamptz not null default now()
);
create index if not exists quiz_sessions_student_idx on quiz_sessions(student_id, created_at desc);

-- Assessments
create table if not exists assessments (
  id          text primary key,
  student_id  text not null references students(id) on delete cascade,
  topic       text not null,
  questions   jsonb not null default '[]',
  created_at  timestamptz not null default now()
);
create index if not exists assessments_student_idx on assessments(student_id);

-- Grade Reports
create table if not exists grade_reports (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   text not null references assessments(id) on delete cascade,
  student_id      text not null references students(id) on delete cascade,
  topic           text not null,
  score           float not null,
  per_question    jsonb not null default '[]',
  updated_status  jsonb not null,
  created_at      timestamptz not null default now()
);
create index if not exists grade_reports_student_idx on grade_reports(student_id);

-- Smart Notes
create table if not exists student_notes (
  id           uuid primary key default gen_random_uuid(),
  student_id   text not null references students(id) on delete cascade,
  topic        text not null,
  summary      text not null default '',
  sections     jsonb not null default '[]',
  key_concepts text[] not null default '{}',
  sources      jsonb not null default '[]',
  created_at   timestamptz not null default now()
);
create index if not exists student_notes_student_idx on student_notes(student_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger students_updated_at before update on students
  for each row execute function update_updated_at();

create trigger knowledge_maps_updated_at before update on knowledge_maps
  for each row execute function update_updated_at();
