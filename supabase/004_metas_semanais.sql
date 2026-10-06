-- Metas semanais do time (não individuais).
-- Rode no SQL Editor do Supabase (uma vez só).
-- A semana é identificada pelo mês e pelo número da semana dentro do mês (1, 2, 3...);
-- as datas de cada semana são calculadas pelo app (segunda a domingo, cortadas no mês).
create table if not exists metas_semanais (
  id uuid primary key default gen_random_uuid(),
  mes text not null, -- formato 'YYYY-MM'
  semana integer not null check (semana between 1 and 6),
  meta_mrr numeric(12, 2) not null default 0,
  meta_nao_recorrente numeric(12, 2) not null default 0,
  unique (mes, semana)
);

alter table metas_semanais enable row level security;
