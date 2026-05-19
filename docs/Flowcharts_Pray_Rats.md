# Flowcharts — Santos Hábitos

Este arquivo contém os fluxos principais do app em Mermaid.

---

## 1. Fluxo principal do aplicativo

```mermaid
flowchart TD
  A[Usuário acessa o app pelo celular] --> B{Usuário está autenticado?}

  B -- Não --> C[Tela de Login/Cadastro]
  C --> D[Criar conta ou fazer login]
  D --> E[Onboarding inicial]

  B -- Sim --> F{Usuário participa de algum grupo?}
  E --> F

  F -- Não --> G{Escolher ação}
  G -- Criar grupo --> H[Criar grupo/desafio]
  G -- Entrar em grupo --> I[Inserir código ou abrir link de convite]

  H --> J[Criar atividades padrão do grupo]
  J --> K[Gerar link/código de convite]
  K --> L[Dashboard do grupo]

  I --> M[Validar código/link]
  M --> N{Código válido?}

  N -- Não --> O[Exibir erro e pedir novo código]
  O --> I

  N -- Sim --> P[Adicionar usuário ao grupo]
  P --> L

  F -- Sim --> L[Dashboard mobile]

  L --> Q{Ação principal}

  Q -- Fazer check-in --> R[Selecionar atividade cristã]
  R --> S[Preencher título, descrição, duração e imagem opcional]
  S --> T[Escolher visibilidade pública ou privada]
  T --> U[Validar limites diário/semanal]
  U --> V{Check-in válido?}

  V -- Não --> W[Exibir aviso de limite atingido]
  W --> L

  V -- Sim --> X[Salvar check-in]
  X --> Y[Calcular pontos]
  Y --> Z[Atualizar feed, dashboard e ranking]
  Z --> L

  Q -- Ver feed --> AA[Exibir check-ins públicos do grupo]
  AA --> L

  Q -- Ver ranking --> AB[Selecionar período semanal, mensal ou geral]
  AB --> AC[Exibir ranking por pontos]
  AC --> L

  Q -- Ver caminhada espiritual --> AD[Exibir constância, calendário e estatísticas pessoais]
  AD --> L

  Q -- Perfil --> AE[Editar perfil e visualizar estatísticas]
  AE --> L

  Q -- Admin grupo --> AF{Usuário é admin?}

  AF -- Não --> AG[Ocultar acesso administrativo]
  AG --> L

  AF -- Sim --> AH[Gerenciar grupo, membros, atividades e pontuação]
  AH --> L
```

---

## 2. Fluxo de criação de check-in

```mermaid
flowchart TD
  A[Usuário toca em Novo Check-in] --> B[Seleciona grupo atual]
  B --> C[Seleciona tipo de atividade]
  C --> D[Carrega regras da atividade]
  D --> E[Preenche título]
  E --> F[Preenche descrição/reflexão opcional]
  F --> G[Adiciona duração opcional]
  G --> H[Adiciona imagem opcional]
  H --> I[Define visibilidade]
  I --> J[Confirma check-in]

  J --> K[Buscar check-ins existentes do usuário]
  K --> L[Verificar limite diário]
  L --> M{Limite diário atingido?}

  M -- Sim --> N[Retornar erro amigável]
  N --> O[Usuário ajusta ou cancela]

  M -- Não --> P[Verificar limite semanal]
  P --> Q{Limite semanal atingido?}

  Q -- Sim --> R[Salvar sem pontuar ou bloquear conforme regra]
  R --> S[Exibir feedback]

  Q -- Não --> T[Calcular pontos da atividade]
  T --> U[Salvar check-in como válido]
  U --> V[Atualizar dashboard]
  V --> W[Atualizar feed se público]
  W --> X[Atualizar ranking]
  X --> Y[Exibir sucesso]
```

---

## 3. Fluxo de criação de grupo

```mermaid
flowchart TD
  A[Usuário clica em Criar grupo] --> B[Preenche nome]
  B --> C[Preenche descrição]
  C --> D[Define data de início e fim]
  D --> E[Confirma criação]
  E --> F[Criar registro em groups]
  F --> G[Gerar invite_code]
  G --> H[Adicionar criador em group_members como admin]
  H --> I[Criar atividades padrão]
  I --> J[Exibir tela do grupo]
  J --> K[Mostrar código/link de convite]
```

---

## 4. Fluxo de entrada em grupo por convite

```mermaid
flowchart TD
  A[Usuário clica em Entrar em grupo] --> B[Informa código de convite]
  B --> C[Buscar grupo pelo invite_code]
  C --> D{Grupo encontrado?}

  D -- Não --> E[Exibir mensagem de erro]
  E --> B

  D -- Sim --> F{Usuário já é membro?}

  F -- Sim --> G[Redirecionar para dashboard do grupo]

  F -- Não --> H[Criar registro em group_members como member]
  H --> I[Exibir mensagem de sucesso]
  I --> J[Redirecionar para dashboard]
```

---

## 5. Fluxo de ranking

```mermaid
flowchart TD
  A[Usuário acessa Ranking] --> B[Seleciona grupo atual]
  B --> C{Seleciona período}
  C -- Semanal --> D[Buscar weekly_group_rankings]
  C -- Mensal --> E[Buscar monthly_group_rankings]
  C -- Geral --> F[Buscar group_rankings]

  D --> G[Ordenar por total_points desc]
  E --> G
  F --> G

  G --> H[Montar lista de participantes]
  H --> I[Destacar usuário logado]
  I --> J[Exibir ranking mobile em cards]
```

---

## 6. Fluxo de admin do grupo

```mermaid
flowchart TD
  A[Usuário acessa Admin do grupo] --> B{Usuário é admin?}

  B -- Não --> C[Bloquear acesso]
  C --> D[Redirecionar para dashboard]

  B -- Sim --> E[Exibir painel admin]

  E --> F[Editar dados do grupo]
  E --> G[Gerenciar membros]
  E --> H[Gerenciar atividades]
  E --> I[Copiar link/código de convite]

  F --> J[Salvar alterações do grupo]
  G --> K[Remover ou alterar membros]
  H --> L[Editar pontuação, limites e status]
  I --> M[Copiar convite para área de transferência]
```

---

## 7. Fluxo de privacidade do check-in

```mermaid
flowchart TD
  A[Usuário cria check-in] --> B{Atividade é privada por padrão?}

  B -- Sim --> C[Definir visibilidade como privada]
  B -- Não --> D[Definir visibilidade como pública]

  C --> E[Usuário pode alterar se permitido]
  D --> E

  E --> F[Salvar check-in]

  F --> G{Visibilidade pública?}

  G -- Sim --> H[Aparece no feed do grupo]
  G -- Não --> I[Não aparece no feed público]

  H --> J[Conta pontos no ranking]
  I --> J
```
