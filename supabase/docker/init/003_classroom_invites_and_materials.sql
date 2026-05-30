-- ============================================================
-- Migration 003: Classroom invites + materials tables
-- Owner: Student/Teacher collaboration
-- Run after: 002_teacher_tables.sql
-- ============================================================

-- Invitations (student-specific codes per classroom)
create table if not exists classroom_invitations (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  classroom_id   uuid not null references classrooms(id) on delete cascade,
  student_id     text not null references students(id) on delete cascade,
  teacher_id     text not null references teachers(id) on delete cascade,
  status         text not null default 'pending'
    check (status in ('pending', 'accepted', 'revoked')),
  created_at     timestamptz not null default now(),
  accepted_at    timestamptz,
  expires_at     timestamptz not null default (now() + interval '30 days')
);

create unique index if not exists classroom_invitations_pending_once_idx
  on classroom_invitations (classroom_id, student_id)
  where status = 'pending';

create index if not exists classroom_invitations_student_idx on classroom_invitations(student_id, status);
create index if not exists classroom_invitations_classroom_idx on classroom_invitations(classroom_id);

-- Classroom resources / learning materials per course
create table if not exists classroom_materials (
  id             uuid primary key default gen_random_uuid(),
  classroom_id   uuid not null references classrooms(id) on delete cascade,
  teacher_id     text not null references teachers(id) on delete cascade,
  title          text not null,
  material_url   text not null,
  content_type   text not null default 'application/pdf',
  description    text not null default '',
  created_at     timestamptz not null default now()
);

create index if not exists classroom_materials_classroom_idx on classroom_materials(classroom_id, created_at desc);
