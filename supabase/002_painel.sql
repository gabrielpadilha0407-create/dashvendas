-- Painel Comercial 2026: metas individuais e reuniões.
-- Rode este arquivo inteiro no SQL Editor do Supabase (uma vez só).

-- Meta de cada pessoa por mês.
-- Closer usa meta_valor (R$ de aquisição total); SDR usa meta_reunioes (reuniões realizadas).
create table if not exists metas_individuais (
  id uuid primary key default gen_random_uuid(),
  mes text not null, -- formato 'YYYY-MM'
  pessoa_id uuid not null references pessoas(id) on delete cascade,
  meta_valor numeric(12, 2) not null default 0,
  meta_reunioes integer not null default 0,
  unique (mes, pessoa_id)
);

create table if not exists reunioes (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  empresa text not null,
  sdr_id uuid not null references pessoas(id) on delete restrict,
  closer_id uuid references pessoas(id) on delete set null,
  status text not null check (status in ('realizada', 'no_show', 'remarcada')),
  created_at timestamptz not null default now()
);

create index if not exists reunioes_data_idx on reunioes (data);
create index if not exists metas_individuais_mes_idx on metas_individuais (mes);

-- Mesmo modelo das outras tabelas: RLS ligado e sem policies,
-- todo acesso passa pelo servidor com a service role key.
alter table metas_individuais enable row level security;
alter table reunioes enable row level security;
