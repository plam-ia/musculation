-- MUSCU V1.2 — à exécuter une seule fois dans Supabase > SQL Editor
-- Permet la nouvelle catégorie sans toucher aux exercices ou séances existants.
begin;
alter table public.muscle_exercises drop constraint if exists muscle_exercises_category_check;
alter table public.muscle_exercises add constraint muscle_exercises_category_check
  check (category in ('Haut du corps','Jambes','Fessiers','Mollets','Core'));
commit;
