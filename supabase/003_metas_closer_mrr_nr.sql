-- Meta de closer separada em MRR e não recorrente.
-- Rode no SQL Editor do Supabase (uma vez só), depois do 002_painel.sql.
alter table metas_individuais
  add column if not exists meta_mrr numeric(12, 2) not null default 0,
  add column if not exists meta_nao_recorrente numeric(12, 2) not null default 0;

-- meta_valor passa a ser só a soma das duas (mantida pelo app).
