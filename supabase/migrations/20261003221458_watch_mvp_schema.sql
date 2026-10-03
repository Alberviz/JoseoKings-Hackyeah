-- Mycrohnie watch MVP schema. Pseudonymous: no names, no emails, no drug names.
-- RLS is on for every table and there are no policies: only the service role (server jobs) can read or write.

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,                 -- e.g. "demo-child-1"; never a real name
  timezone text not null default 'Europe/Madrid',
  birth_year smallint check (birth_year between 2005 and 2026),
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

-- Raw watch data, one row per minute bucket / sleep segment, exactly as Google Fit returned it.
create table if not exists public.watch_samples (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  metric text not null check (metric in
    ('steps','heart_rate','active_minutes','calories','distance','spo2','sleep_session','sleep_segment')),
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at >= start_at),
  value double precision not null,            -- steps, bpm (average), minutes, kcal, metres, %, or duration in minutes for sleep
  value_max double precision,                 -- summaries only (heart rate, SpO2)
  value_min double precision,
  stage text,                                 -- sleep_segment only: awake | sleep | out_of_bed | light | deep | rem
  source text not null,                       -- origin data stream (app / device)
  ingested_at timestamptz not null default now(),
  unique (subject_id, metric, source, start_at)
);
create index if not exists watch_samples_subject_metric_time on public.watch_samples (subject_id, metric, start_at);

-- Child check-in, one per local day. 0 = easiest day, 2 = hardest. skipped = "I don't feel like it today".
create table if not exists public.checkins (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  local_date date not null,
  belly_comfort smallint check (belly_comfort between 0 and 2),
  energy smallint check (energy between 0 and 2),
  play_pace smallint check (play_pace between 0 and 2),
  skipped boolean not null default false,
  answered_at timestamptz not null default now(),
  check (skipped or (belly_comfort is not null and energy is not null and play_pace is not null)),
  unique (subject_id, local_date)
);

-- Parent daily log.
create table if not exists public.parent_logs (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  local_date date not null,
  sleep_hours numeric(4,2) check (sleep_hours between 0 and 24),
  school text check (school in ('attended','left-early','missed','no-school')),
  medication_taken text check (medication_taken in ('yes','partly','no','not-applicable')),
  note text,
  created_at timestamptz not null default now(),
  unique (subject_id, local_date)
);

-- Physical observations by parents. Open list of kinds so the clinical team can add items without a migration;
-- the allowed kinds and their scales live in the app content, not here.
create table if not exists public.parent_observations (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  observed_at timestamptz not null,
  local_date date not null,
  kind text not null,                         -- e.g. 'bathroom_visits', 'night_wakings_seen', 'appetite'
  value_num double precision,
  value_text text,
  created_at timestamptz not null default now()
);
create index if not exists parent_observations_subject_date on public.parent_observations (subject_id, local_date);

create table if not exists public.food_entries (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  local_date date not null,
  tags text[] not null default '{}',
  text text,
  created_at timestamptz not null default now()
);

create table if not exists public.missions_done (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  done_at timestamptz not null,
  local_date date not null,
  mission_id text not null,
  company text not null check (company in ('alone','someone','family')),
  stopped_early boolean not null default false
);

create table if not exists public.consultations (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  local_date date not null,
  unique (subject_id, local_date)
);

-- Written by the analysis job: one row per subject and local day, plus the validity flags behind it.
create table if not exists public.daily_metrics (
  subject_id uuid not null references public.subjects(id) on delete cascade,
  local_date date not null,
  steps integer,
  hr_waking_hours_covered smallint,           -- distinct waking hours with heart-rate data
  resting_hr double precision,                -- lowest 30-min rolling mean inside the main sleep session
  sleep_minutes double precision,             -- asleep time of the main sleep session ending that morning
  sleep_onset_at timestamptz,
  sleep_offset_at timestamptz,
  valid_activity boolean not null default false,
  valid_sleep boolean not null default false,
  computed_at timestamptz not null default now(),
  algorithm_version text not null,
  primary key (subject_id, local_date)
);

-- Every analysis run is stored with its parameters and seed, so any number in a report can be reproduced.
create table if not exists public.analysis_runs (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  run_at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  algorithm_version text not null,
  seed bigint not null,
  params jsonb not null,
  results jsonb not null
);

create table if not exists public.collector_runs (
  id bigint generated always as identity primary key,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  started_at timestamptz not null,
  window_start timestamptz not null,
  window_end timestamptz not null,
  rows_written integer not null,
  counts jsonb not null default '{}',
  errors jsonb not null default '{}'
);

do $$
declare t text;
begin
  foreach t in array array['subjects','watch_samples','checkins','parent_logs','parent_observations',
    'food_entries','missions_done','consultations','daily_metrics','analysis_runs','collector_runs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

insert into public.subjects (label, timezone, is_demo) values ('demo-child-1', 'Europe/Madrid', true)
on conflict (label) do nothing;

