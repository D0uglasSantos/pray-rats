# Pray Rats 🐀🙏

> PWA de check-ins cristãos em grupo — constância espiritual, comunhão e incentivo saudável entre amigos.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**Links:** [Deploy](https://pray-rats.vercel.app) · [GitHub](https://github.com/D0uglasSantos/pray-rats) · [PRD](./PRD_Pray_Rats.md) · [Schema DB](./Schema_DB_Pray_Rats.md) · [Flowcharts](./Flowcharts_Pray_Rats.md)

---

## Requisitos

- **Node.js 20+**
- **npm 10+**
- Projeto no [Supabase](https://supabase.com) (Auth + Postgres + Storage)
- Conta na [Vercel](https://vercel.com) para deploy (opcional em dev local)

---

## Como rodar localmente

### 1. Clonar e instalar

```bash
git clone https://github.com/D0uglasSantos/pray-rats.git
cd pray-rats
npm install --legacy-peer-deps
```

### 2. Variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha no mínimo:

| Variável | Onde obter |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (secret) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` em dev |

Lista completa e opcionais (Push, Sentry): [.env.local.example](./.env.local.example)

### 3. Banco de dados (migrations)

As migrations ficam em `supabase/migrations/`. **Não usamos Supabase CLI** neste projeto — aplique pelo **SQL Editor** do dashboard.

#### Projeto novo (banco vazio)

Execute **na ordem numérica** no [SQL Editor](https://supabase.com/dashboard):

| Arquivo | Conteúdo |
|---------|----------|
| `001_initial_schema.sql` | Schema base, RLS, RPCs |
| `002_fix_groups_rls.sql` | Correções RLS de grupos |
| `003_storage_policies.sql` | Políticas Storage (requer buckets — ver abaixo) |
| `004` … `010` | Features incrementais |
| `011` … `017` | Segurança, rate limit, rankings MV, OAuth |

#### Projeto já em produção (atualização incremental)

Use `supabase/migrations/APLICAR_NO_DASHBOARD.sql` — seções **011–017** documentadas e idempotentes. Cole uma seção por vez ou o arquivo inteiro.

### 4. Storage (Supabase Dashboard)

Em **Storage → New bucket**, crie:

| Bucket | Público | Uso |
|--------|---------|-----|
| `avatars` | Sim | Foto de perfil |
| `checkins` | Sim | Fotos de check-in |

Depois rode `003_storage_policies.sql` (se ainda não aplicou).

### 5. Supabase Auth

**Authentication → URL Configuration**

| Campo | Valor (dev) | Valor (prod) |
|-------|-------------|--------------|
| Site URL | `http://localhost:3000` | `https://pray-rats.vercel.app` |
| Redirect URLs | Ver `.env.local.example` | Mesmas paths com domínio de prod |

**E-mail (recuperação de senha)**

- **Sem SMTP:** o Supabase envia pelo serviço padrão (suficiente para MVP).
- **Com SMTP (opcional):** Authentication → Emails → SMTP Settings (Resend, Gmail, etc.).

O link de reset redireciona para `/reset-password` — essa URL **precisa** estar na lista de Redirect URLs.

**Login social (opcional)**

1. Authentication → Providers → Google / Apple  
2. `src/lib/auth-features.ts` → `SOCIAL_AUTH_ENABLED = true`  
3. Descomente `SocialAuthButtons` em `login-form.tsx` e `signup-form.tsx`

### 6. Subir o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

> O dev usa Webpack (`next dev --webpack`) por compatibilidade com PWA e Sentry.

---

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. **Environment Variables** (Production):

| Variável | Obrigatória |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim |
| `NEXT_PUBLIC_APP_URL` | Sim (`https://pray-rats.vercel.app` ou domínio custom) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Se usar push |
| `VAPID_PRIVATE_KEY` | Se usar push |
| `VAPID_SUBJECT` | Se usar push |
| `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` | Opcional |

3. Atualize **Site URL** e **Redirect URLs** no Supabase com a URL de produção.
4. Deploy → a Vercel roda `npm run build` automaticamente.

### CI — testes E2E (GitHub Actions)

Secrets em **Settings → Secrets → Actions**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Workflow: [.github/workflows/e2e.yml](./.github/workflows/e2e.yml)

---

## Checklist go-live

- [ ] Migrations `001`–`017` aplicadas (ou `APLICAR_NO_DASHBOARD.sql` se DB existente)
- [ ] Buckets `avatars` e `checkins` criados + políticas (`003`)
- [ ] `NEXT_PUBLIC_APP_URL` na Vercel = Site URL no Supabase
- [ ] Redirect URLs: `/auth/callback` e `/reset-password` (dev + prod)
- [ ] Teste: cadastro, login, esqueci senha, check-in com foto, feed, ranking
- [ ] Push (opcional): chaves VAPID na Vercel + permissão no navegador
- [ ] Sentry (opcional): DSN configurado + alertas

---

## Funcionalidades

- **Auth:** login, cadastro, recuperação de senha, OAuth (Google/Apple — opcional)
- **Grupos:** criação, convite, administração de membros
- **Check-ins:** registro com foto, limites diários/semanais, validação no Postgres
- **Gamificação:** pontos, streaks, ranking semanal/mensal (materialized views)
- **Feed social** e **notificações** (in-app + Web Push)
- **PWA:** instalável, offline fallback

---

## Arquitetura

```text
src/
├── actions/          # Server Actions (auth, groups, checkins, profile)
├── app/              # App Router
│   ├── (auth)/       # login, signup, forgot/reset password
│   ├── (main)/       # home, feed, ranking, journey, profile
│   └── auth/callback # OAuth e links de e-mail
├── components/       # UI e features
├── lib/              # Supabase, cache, push, monitoring
└── types/
e2e/                  # Playwright
supabase/migrations/  # SQL versionado (aplicar no dashboard)
```

---

## Tecnologias

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Supabase (Postgres, Auth, Storage, RPCs)
- **Testes:** Vitest, Playwright
- **Observabilidade:** Vercel Analytics, Sentry (opcional)
- **Deploy:** Vercel

---

## Testes

```bash
# Unitários
npm test

# Integração (requer SUPABASE_SERVICE_ROLE_KEY no .env.local)
npm run test:integration

# E2E (build + servidor na porta 3100)
npm run build
npm run test:e2e
```

---

## Aprendizados técnicos

- **Server Actions** para mutações sem API routes boilerplate
- **RPCs e triggers** no Postgres para limites de check-in sem race conditions
- **Materialized views** + refresh assíncrono para rankings performáticos
- **PWA** com service worker e push notifications
- **Supabase SSR** (`@supabase/ssr`) com cookies e PKCE

---

*Desenvolvido com dedicação para fortalecer a comunidade e a constância.* 🚀
