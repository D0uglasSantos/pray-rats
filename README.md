# Pray Rats 🐀🙏

> Aplicativo PWA de check-ins cristãos em grupo — constância espiritual, comunhão e incentivo saudável entre amigos.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat&logo=pwa)](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

**Links do Projeto:**
[Deploy (Live Demo)](#) | [Repositório no GitHub](#) | [PRD](./PRD_Pray_Rats.md) | [Schema DB](./Schema_DB_Pray_Rats.md) | [Flowcharts](./Flowcharts_Pray_Rats.md)

---

## 📌 O Problema
Manter a constância em hábitos espirituais (como leitura bíblica, oração e jejum) pode ser desafiador quando feito de forma isolada. A falta de acompanhamento e incentivo mútuo frequentemente leva ao desânimo e à inconsistência na rotina.

## 💡 A Solução
O **Pray Rats** é uma plataforma gamificada focada na construção de hábitos espirituais através da comunidade. Ao criar grupos privados, amigos podem realizar check-ins diários de suas atividades, acompanhar o progresso uns dos outros via feed, e participar de um ranking amigável. A transparência e o suporte mútuo transformam a disciplina individual em uma jornada coletiva e engajadora.

## ✨ Funcionalidades
- **Autenticação Segura:** Login, cadastro e recuperação de senha (Supabase Auth).
- **Gestão de Grupos:** Criação de grupos privados com códigos de convite e administração de membros.
- **Check-ins Inteligentes:** Registro de atividades com validação de limites diários e semanais.
- **Gamificação:** Cálculo automático de pontuação, streaks (ofensivas) e ranking semanal/mensal.
- **Feed Social:** Acompanhamento em tempo real das atividades dos membros do grupo.
- **Dashboard Pessoal:** Visão geral do progresso diário e caminhada espiritual.
- **PWA (Progressive Web App):** Instalável no celular, oferecendo experiência nativa.

## 📸 Screenshots
<div align="center">
  <img src="https://via.placeholder.com/250x500.png?text=Dashboard" alt="Dashboard" width="200"/>
  <img src="https://via.placeholder.com/250x500.png?text=Feed+Social" alt="Feed Social" width="200"/>
  <img src="https://via.placeholder.com/250x500.png?text=Ranking" alt="Ranking" width="200"/>
  <img src="https://via.placeholder.com/250x500.png?text=Perfil" alt="Perfil" width="200"/>
</div>

*(Substitua os placeholders acima por capturas de tela reais do aplicativo)*

## 🏗 Arquitetura
O projeto segue uma arquitetura moderna baseada no **Next.js App Router**, utilizando **React Server Components (RSC)** e **Server Actions** para mutações de dados, garantindo alta performance e SEO. O estado global e a persistência de dados são gerenciados pelo **Supabase**.

```text
src/
├── actions/          # Server Actions (auth, groups, checkins, profile)
├── app/              # Rotas da aplicação (App Router)
│   ├── (auth)/       # Rotas públicas de autenticação
│   ├── (main)/       # Rotas privadas (Dashboard, Feed, Ranking, Perfil)
│   └── groups/       # Gerenciamento de grupos e convites
├── components/       # Componentes React reutilizáveis (UI e features)
├── hooks/            # Custom hooks para lógica de cliente
├── lib/              # Configurações do Supabase, utilitários e constantes
└── types/            # Definições de tipos do TypeScript
```

## 🛠 Tecnologias Utilizadas
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide Icons.
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Storage, Edge Functions/RPCs).
- **Testes:** Vitest (Testes unitários e de integração).
- **Deploy:** Vercel.

## 🗄 Modelagem do Banco (Supabase)
O banco de dados relacional foi desenhado para suportar a lógica de grupos e check-ins com alta integridade:
- `users`: Perfis estendidos vinculados ao Auth do Supabase.
- `groups` & `group_members`: Relacionamento N:N para gestão de comunidades.
- `activities`: Catálogo de hábitos espirituais (ex: Leitura Bíblica, Oração).
- `checkins`: Registro transacional das atividades realizadas, com validações via RPC e Triggers para garantir limites diários/semanais.

> 📄 Veja o [Schema DB completo](./Schema_DB_Pray_Rats.md) para mais detalhes.

## 🧪 Testes
A aplicação conta com uma suíte robusta de testes para garantir a confiabilidade das regras de negócio.

```bash
# Executar testes unitários (regras, cálculos, validações)
npm test

# Modo watch durante desenvolvimento
npm run test:watch

# Testes de integração com Supabase real (requer SUPABASE_SERVICE_ROLE_KEY)
npm run test:integration

# Testes E2E com Playwright (build + servidor local; autenticados requerem service role)
npm run build
npm run test:e2e
```

**Cobertura atual:**
- Validação de limites diários/semanais de check-in.
- Lógica de cálculo de streaks (ofensivas) e pontuação.
- Geração de ranking e estatísticas de grupo.
- Regras de visibilidade do Feed (público vs privado).
- Fluxos completos de banco de dados (Integração).
- E2E Playwright: rotas públicas (login, cadastro) e fluxos autenticados (grupo, check-in, feed).

## 🚀 Como rodar localmente

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/seu-usuario/pray-rats.git
cd pray-rats
npm install
```

### 2. Configurar o Supabase
1. Crie um projeto no [Supabase](https://supabase.com).
2. Execute as migrations localizadas na pasta `supabase/migrations/` no SQL Editor do seu projeto.
3. Crie os buckets de Storage: `avatars` e `checkins` (com acesso público).
4. Copie o arquivo de exemplo e preencha as variáveis de ambiente:
```bash
cp .env.local.example .env.local
```
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador. Para testar o PWA, acesse pelo celular na mesma rede e use a opção "Adicionar à tela inicial".

## 📈 Próximas Melhorias
- [ ] Implementar notificações Push para lembretes de check-in.
- [ ] Adicionar sistema de conquistas (Badges/Medalhas) por marcos alcançados.
- [ ] Criar área de chat/comentários nos check-ins do feed.
- [ ] Suporte a múltiplos grupos por usuário.
- [ ] Temas personalizados (Dark/Light mode aprimorado).

## 🧠 Aprendizados Técnicos
Durante o desenvolvimento deste projeto, os principais desafios e aprendizados incluíram:
- **Server Actions no Next.js:** Transição de rotas de API tradicionais para Server Actions, reduzindo o boilerplate e melhorando a segurança das mutações de dados.
- **Supabase RPCs e Triggers:** Delegação de regras de negócio complexas (como validação de limites de check-ins concorrentes) diretamente para o banco de dados PostgreSQL, prevenindo *race conditions*.
- **PWA Moderno:** Configuração de manifest e service workers integrados ao ecossistema do Next.js para entregar uma experiência *app-like*.
- **Otimização de Consultas:** Uso de índices compostos e views materializadas/RPCs para garantir que o cálculo de rankings e feeds em tempo real permaneça performático à medida que a base de dados cresce.

---
*Desenvolvido com dedicação para fortalecer a comunidade e a constância.* 🚀
