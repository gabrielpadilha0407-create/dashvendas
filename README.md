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

## Fora de escopo nesta versão

Integração com CRM, notificações de meta batida, e exportação de relatórios em
PDF/Excel — como definido no escopo inicial.
