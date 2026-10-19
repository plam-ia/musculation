-- MA MUSCULATION — V1 (Supabase / PostgreSQL)
-- A exécuter UNE FOIS dans Supabase > SQL Editor > New query.
-- Prérequis : un projet Supabase, puis un unique utilisateur dans Authentication > Users.

create table if not exists public.muscle_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 140),
  category text not null check (category in ('Haut du corps','Jambes','Fessiers','Core')),
  primary_muscle text not null,
  muscles text[] not null default '{}',
  requires_machine boolean not null default false,
  tracking_type text not null default 'reps' check (tracking_type in ('reps','time')),
  notes text not null default '',
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique(id, user_id)
);

create table if not exists public.muscle_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  location text not null default 'Maison' check (location in ('Maison','INSEP','ON AIR')),
  duration_min integer check (duration_min is null or (duration_min between 0 and 600)),
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(id, user_id)
);

create table if not exists public.muscle_session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_id uuid not null,
  exercise_id uuid not null,
  position integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default now(),
  unique(id, user_id),
  constraint session_owner_fk foreign key (session_id, user_id)
    references public.muscle_sessions(id, user_id) on delete cascade,
  constraint exercise_owner_fk foreign key (exercise_id, user_id)
    references public.muscle_exercises(id, user_id) on delete restrict
);

create table if not exists public.muscle_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  session_exercise_id uuid not null,
  position integer not null default 1,
  reps integer check (reps is null or (reps between 0 and 1000)),
  seconds integer check (seconds is null or (seconds between 0 and 36000)),
  kg numeric(8,2) not null default 0 check (kg >= 0 and kg <= 10000),
  rir numeric(3,1) check (rir is null or (rir between 0 and 10)),
  side text not null default 'both' check (side in ('both','left','right','alternating')),
  created_at timestamptz not null default now(),
  constraint set_session_owner_fk foreign key (session_exercise_id, user_id)
    references public.muscle_session_exercises(id, user_id) on delete cascade
);

create index if not exists idx_muscle_exercises_user on public.muscle_exercises(user_id);
create index if not exists idx_muscle_sessions_user_date on public.muscle_sessions(user_id,session_date desc);
create index if not exists idx_muscle_session_exercises_session on public.muscle_session_exercises(session_id,position);
create index if not exists idx_muscle_session_exercises_exercise on public.muscle_session_exercises(exercise_id);
create index if not exists idx_muscle_sets_entry on public.muscle_sets(session_exercise_id,position);

-- Défense en profondeur : aucun accès aux données pour les visiteurs non connectés.
alter table public.muscle_exercises enable row level security;
alter table public.muscle_sessions enable row level security;
alter table public.muscle_session_exercises enable row level security;
alter table public.muscle_sets enable row level security;

revoke all on public.muscle_exercises, public.muscle_sessions,
  public.muscle_session_exercises, public.muscle_sets from anon;
revoke all on public.muscle_exercises, public.muscle_sessions,
  public.muscle_session_exercises, public.muscle_sets from authenticated;
grant select, insert, update, delete on public.muscle_exercises,
  public.muscle_sessions, public.muscle_session_exercises, public.muscle_sets to authenticated;

-- Les données appartiennent uniquement à l'utilisateur identifié.
-- Réexécutable si on doit ajuster les politiques ultérieurement.
do $$
declare t text;
begin
  foreach t in array array['muscle_exercises','muscle_sessions','muscle_session_exercises','muscle_sets'] loop
    execute format('drop policy if exists "own_read" on public.%I',t);
    execute format('drop policy if exists "own_insert" on public.%I',t);
    execute format('drop policy if exists "own_update" on public.%I',t);
    execute format('drop policy if exists "own_delete" on public.%I',t);
    execute format('create policy "own_read" on public.%I for select to authenticated using ((select auth.uid()) = user_id)',t);
    execute format('create policy "own_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "own_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',t);
    execute format('create policy "own_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)',t);
  end loop;
end $$;
