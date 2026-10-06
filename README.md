# Dashboard de Vendas da Agência

Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Supabase (Postgres).
Acesso por senha única de equipe, dados compartilhados para todo o time.

## 1. Instalar o Node.js

Esta máquina não tem Node.js instalado. Baixe a versão LTS em https://nodejs.org
e instale antes de continuar. Depois confirme no terminal:

```
node -v
npm -v
```

## 2. Criar o banco no Supabase

1. Crie um projeto gratuito em https://supabase.com.
2. Abra **SQL Editor** e rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) inteiro.
3. Em **Project Settings → API**, copie a **Project URL** e a **service_role key**
   (não a `anon` key — o app usa a service role key só no servidor).

## 3. Configurar variáveis de ambiente

```
cp .env.local.example .env.local
```

Preencha `.env.local`:

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`: do passo anterior.
- `TEAM_PASSWORD`: a senha que o time vai usar para entrar.
- `AUTH_COOKIE_SECRET`: qualquer string longa e aleatória (ex: gere com `openssl rand -hex 32`).

## 4. Rodar localmente

```
npm install
npm run dev
```

Acesse http://localhost:3000 e entre com a senha definida em `TEAM_PASSWORD`.

## 5. Deploy na Vercel

```
npm i -g vercel
vercel
```

No painel do projeto na Vercel, em **Settings → Environment Variables**, adicione as
mesmas variáveis do `.env.local` (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`TEAM_PASSWORD`, `AUTH_COOKIE_SECRET`). Depois faça o deploy de produção:

```
vercel --prod
```

Compartilhe a URL gerada com o time junto com a senha de equipe.

## Modelo de dados

- **pessoas**: papel `SDR | Closer | Operacional`. Monetização/Upsell é atribuída a
  uma pessoa Operacional; MRR e Não recorrente exigem um Closer (SDR é opcional).
- **vendas**: cada linha tem `sdr_id` (opcional), `closer_id` e `operacional_id`,
  com um check constraint no banco garantindo a combinação certa por tipo.
- **metas**: uma linha por mês (`YYYY-MM`); ao navegar para um mês sem meta, o app
  cria automaticamente uma linha zerada.

## Painel Comercial 2026 (`/painel`)

Tela única para TV e celular com meta × realizado do mês, ranking de closers e SDRs e visão do ano.
Usa as mesmas pessoas e vendas lançadas no dashboard e a mesma senha de equipe.

- **Instalação (uma vez):** rode [`supabase/002_painel.sql`](supabase/002_painel.sql) no SQL Editor do Supabase.
  Ele cria as tabelas `metas_individuais` e `reunioes`.
- **`/painel`:** visão TV. Relê os dados a cada 5 minutos; o botão Atualizar força a leitura.
- **`/painel/metas`:** meta global do mês (MRR e não recorrente) e meta de cada pessoa —
  closer com meta de MRR e de não recorrente (a meta total é a soma), SDR em número de reuniões
  realizadas. Botão para copiar do mês anterior. Requer também `supabase/003_metas_closer_mrr_nr.sql`.
- **`/painel/semanas`:** metas semanais do time (MRR e não recorrente por semana, editáveis e sem divisão por pessoa),
  com realizado, falta e meta diária da semana. Requer `supabase/004_metas_semanais.sql`. O Painel mostra a semana atual.
- **`/painel/reunioes`:** lançamento das reuniões dos SDRs (realizada, no-show, remarcada).
- **Comemoração:** quando a meta de aquisição, MRR ou não recorrente do mês atual é batida, o painel solta fogos
  uma vez por meta em cada aparelho. Para testar: `/painel?comemorar=1`.
- **Regras:** aquisição = MRR + não recorrente; o setup de uma venda MRR conta como não recorrente;
  Monetização não entra no painel. Ritmo necessário = quanto falta ÷ dias úteis restantes (contando hoje),
  descontando os feriados de [`lib/painel/feriados.ts`](lib/painel/feriados.ts) (calculados para qualquer ano).
- **Ano:** o seletor vai de 2026 até o ano seguinte ao atual; na virada do ano o painel abre sozinho no ano novo.
- **Adicionar ou remover alguém:** em Configurações, como já é hoje. Inativos somem do painel,
  exceto nos meses em que tiverem venda, reunião ou meta.

## Fora de escopo nesta versão

Integração com CRM, notificações de meta batida, e exportação de relatórios em
PDF/Excel — como definido no escopo inicial.
