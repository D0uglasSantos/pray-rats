# Pray Rats

Aplicativo de check-ins cristãos em grupo — constância espiritual, comunhão e incentivo saudável entre amigos.

## Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Auth, PostgreSQL, Storage)
- **PWA** instalável no celular

## Funcionalidades do MVP

- Autenticação (login, cadastro, recuperação de senha, logout)
- Onboarding (criar ou entrar em grupo)
- Grupos/desafios com código de convite
- 9 atividades cristãs padrão por grupo
- Check-ins com validação de limites diário/semanal
- Dashboard (Hoje), Feed, Ranking, Caminhada espiritual, Perfil
- Administração do grupo (membros, atividades, pontuação)

## Setup

### 1. Clonar e instalar

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Execute a migration em `supabase/migrations/001_initial_schema.sql` no SQL Editor
3. Crie buckets de Storage: `avatars` e `checkins` (públicos)
4. Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Rodar localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

### 4. Instalar como PWA

No celular, abra o app no navegador e use **Adicionar à tela inicial**.

## Estrutura

```
src/
├── actions/          # Server Actions (auth, groups, checkins, profile)
├── app/
│   ├── (auth)/       # Login, cadastro, recuperar senha
│   ├── (main)/       # App principal com bottom nav
│   ├── groups/       # Criar, entrar, admin
│   └── onboarding/
├── components/       # UI reutilizável
├── hooks/            # Hooks customizados
├── lib/              # Supabase, utils, constants
└── types/            # TypeScript types
```

## Deploy

Recomendado: [Vercel](https://vercel.com) com variáveis de ambiente configuradas.

## Testes

```bash
# Testes unitários (regras, cálculos, validações) — 40 testes
npm test

# Modo watch durante desenvolvimento
npm run test:watch

# Testes de integração com Supabase real (opcional)
# Adicione SUPABASE_SERVICE_ROLE_KEY no .env.local
npm run test:integration
```

Cobertura dos testes:
- Limites diário/semanal de check-in
- Cálculo de streak e pontuação
- Ranking e estatísticas
- Feed (público vs privado)
- Atividades padrão e validações de auth/grupo
- Fluxo completo no Supabase (com service role)

## Documentação

- [PRD](./PRD_Pray_Rats.md)
- [Schema DB](./Schema_DB_Pray_Rats.md)
- [Flowcharts](./Flowcharts_Pray_Rats.md)
