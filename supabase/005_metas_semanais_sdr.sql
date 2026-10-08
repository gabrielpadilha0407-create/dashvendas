-- Meta semanal de reuniões realizadas, por SDR.
-- Rode no SQL Editor do Supabase (uma vez só).
create table if not exists metas_semanais_sdr (
  id uuid primary key default gen_random_uuid(),
  mes text not null, -- formato 'YYYY-MM'
  semana integer not null check (semana between 1 and 6),
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  meta_reunioes integer not null default 0,
  unique (mes, semana, pessoa_id)
);

alter table metas_semanais_sdr enable row level security;
