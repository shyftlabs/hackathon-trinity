-- ============================================================
-- Migration 002: Teacher tables
-- Owner: Teacher developer
-- Run AFTER 001_student_tables.sql
-- ============================================================

-- Teachers
create table if not exists teachers (
  id           text primary key,
  email        text unique not null,
  name         text not null default '',
  institution  text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Classrooms / Cohorts
create table if not exists classrooms (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   text not null references teachers(id) on delete cascade,
  name         text not null,
  description  text not null default '',
  topics       text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists classrooms_teacher_idx on classrooms(teacher_id);

-- Enrollments (many-to-many students ↔ classrooms)
create table if not exists enrollments (
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  student_id    text not null references students(id) on delete cascade,
  enrolled_at   timestamptz not null default now(),
  primary key (classroom_id, student_id)
);

-- Syllabi (teacher uploads topic list for a classroom)
create table if not exists syllabi (
  id            uuid primary key default gen_random_uuid(),
  classroom_id  uuid not null references classrooms(id) on delete cascade,
  teacher_id    text not null references teachers(id) on delete cascade,
  topics        text[] not null default '{}',
  description   text not null default '',
  created_at    timestamptz not null default now()
);
create index if not exists syllabi_classroom_idx on syllabi(classroom_id);

-- Cohort Snapshots (point-in-time analytics per classroom)
create table if not exists cohort_snapshots (
  id                uuid primary key default gen_random_uuid(),
  classroom_id      uuid not null references classrooms(id) on delete cascade,
  total_students    int not null default 0,
  avg_mastery       float not null default 0.0,
  topic_breakdown   jsonb not null default '[]',   -- [{topic, level, evidence}]
  struggling_topics text[] not null default '{}',
  created_at        timestamptz not null default now()
);
create index if not exists cohort_snapshots_classroom_idx on cohort_snapshots(classroom_id, created_at desc);

-- Auto-update triggers
create trigger teachers_updated_at before update on teachers
  for each row execute function update_updated_at();

create trigger classrooms_updated_at before update on classrooms
  for each row execute function update_updated_at();
