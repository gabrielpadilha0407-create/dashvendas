-- Schema do Dashboard de Vendas da Agência
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

create type papel_pessoa as enum ('SDR', 'Closer', 'Operacional');
create type tipo_venda as enum ('MRR', 'Não recorrente', 'Monetização');

create table pessoas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  papel papel_pessoa not null,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table vendas (
  id uuid primary key default gen_random_uuid(),
  data date not null,
  tipo tipo_venda not null,
  valor numeric(12, 2) not null check (valor > 0),
  cliente text not null,
  observacao text,
  sdr_id uuid references pessoas(id) on delete set null,
  closer_id uuid references pessoas(id) on delete set null,
  operacional_id uuid references pessoas(id) on delete set null,
  created_at timestamptz not null default now(),
  -- MRR e Não recorrente: closer obrigatório, sdr opcional, sem operacional.
  -- Monetização: operacional obrigatório, sem sdr/closer.
  constraint venda_atribuicao_check check (
    (
      tipo = 'Monetização'
      and operacional_id is not null
      and closer_id is null
      and sdr_id is null
    )
    or (
      tipo in ('MRR', 'Não recorrente')
      and closer_id is not null
      and operacional_id is null
    )
  )
);

create index vendas_data_idx on vendas (data);
create index vendas_closer_idx on vendas (closer_id);
create index vendas_sdr_idx on vendas (sdr_id);
create index vendas_operacional_idx on vendas (operacional_id);

create table metas (
  id uuid primary key default gen_random_uuid(),
  mes text not null unique, -- formato 'YYYY-MM'
  meta_mrr numeric(12, 2) not null default 0,
  meta_nao_recorrente numeric(12, 2) not null default 0,
  meta_monetizacao numeric(12, 2) not null default 0
);

-- RLS fica ligado e sem policies: toda a leitura/escrita passa pelo backend
-- (Server Actions/Server Components) usando a service role key, nunca pelo
-- cliente no navegador. O gate de acesso é a senha única de equipe.
alter table pessoas enable row level security;
alter table vendas enable row level security;
alter table metas enable row level security;
