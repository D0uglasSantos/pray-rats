# PRD — Santos Hábitos

## 1. Visão geral do produto

O **Santos Hábitos** é um aplicativo de check-ins cristãos em grupo, inspirado na lógica de apps de constância e competição saudável, como apps de desafios de atividades diárias.

A proposta é permitir que amigos, grupos de jovens, comunidades, ministérios ou pequenos grupos registrem atividades cristãs diárias, acompanhem sua constância espiritual, participem de rankings e se incentivem mutuamente.

O produto não deve ser tratado como uma competição sobre “quem é mais santo”, mas sim como uma ferramenta de:

- Constância espiritual.
- Comunhão entre amigos.
- Incentivo saudável.
- Acompanhamento da caminhada cristã.
- Formação de bons hábitos.

Como a maioria dos usuários usará pelo celular, o app deve ser desenvolvido com foco **mobile-first**, funcionando como um **PWA instalável**, acessível por link, sem necessidade inicial de Play Store ou App Store.

---

## 2. Objetivo do produto

Criar uma aplicação simples, bonita, responsiva e mobile-first para que usuários possam:

- Criar grupos/desafios cristãos.
- Entrar em grupos por código ou link.
- Registrar check-ins de atividades cristãs.
- Acompanhar pontuação e ranking.
- Visualizar sua caminhada espiritual.
- Ver o feed de atividades dos amigos.
- Gerenciar atividades, pontuações e limites do grupo.
- Usar o app pelo celular como se fosse um aplicativo instalado.

---

## 3. Público-alvo

### Público principal

- Jovens cristãos.
- Grupos de amigos da igreja.
- Grupos de oração.
- Ministérios.
- Comunidades paroquiais.
- Consagrados.
- Pessoas que desejam melhorar sua rotina espiritual.

### Perfil de uso esperado

- Uso majoritariamente mobile.
- Acesso rápido durante o dia.
- Check-ins feitos em poucos toques.
- Participação em grupos pequenos ou médios.
- Usuários não necessariamente técnicos.
- Necessidade de interface clara, simples e bonita.

---

## 4. Problema

Muitas pessoas têm dificuldade em manter uma rotina espiritual constante. Mesmo com desejo de rezar, ler a Bíblia, participar da Santa Missa ou fazer momentos de formação, a falta de acompanhamento e incentivo pode dificultar a perseverança.

Além disso, grupos de amigos normalmente tentam organizar desafios espirituais por WhatsApp, planilhas ou mensagens soltas, dificultando:

- Controle de participação.
- Visualização de progresso.
- Ranking justo.
- Registro de atividades.
- Incentivo diário.
- Continuidade do desafio.

---

## 5. Solução proposta

Criar um app de check-ins cristãos onde cada usuário possa registrar suas atividades espirituais, acumular pontos, visualizar sua evolução e participar de rankings com seus amigos.

A solução deve ter gamificação leve, sem estimular vaidade ou competição exagerada.

O foco deve estar em:

- Constância.
- Comunhão.
- Crescimento pessoal.
- Caminhada espiritual.
- Incentivo fraterno.

---

## 6. Posicionamento

O produto deve ser comunicado como:

> Um aplicativo de constância espiritual em grupo, com check-ins, metas, ranking saudável e acompanhamento da caminhada cristã.

Evitar comunicação como:

> Um app para medir quem é mais santo.

---

## 7. Plataforma e stack recomendada

### Plataforma

**Web App PWA mobile-first**

Os usuários acessam por link, podem adicionar à tela inicial do celular e usar como app, sem publicação inicial nas lojas.

### Stack

- Next.js com App Router.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Vercel.
- PWA com manifest e service worker.
- Hooks customizados.
- Services ou Server Actions.
- Componentes reutilizáveis.

### Justificativa

Essa abordagem permite validar o produto rapidamente com amigos e grupos reais, sem lidar inicialmente com builds mobile, TestFlight, APKs, App Store ou Play Store.

---

## 8. Princípios de UX/UI

### Mobile-first obrigatório

A experiência deve ser desenhada primeiro para celular.

### Diretrizes

- Interface limpa e moderna.
- Aparência de app nativo.
- Bottom navigation fixa.
- Botão central de check-in destacado.
- Cards grandes e fáceis de tocar.
- Inputs grandes e confortáveis.
- Tipografia legível.
- Poucos elementos por tela.
- Feedback visual após ações.
- Estados vazios bem escritos.
- Skeleton loading.
- Evitar tabelas no mobile.
- Usar listas e cards.
- Performance otimizada para redes móveis.

### Navegação principal mobile

Bottom navigation com:

1. Hoje
2. Feed
3. Check-in
4. Ranking
5. Perfil

---

## 9. Funcionalidades do MVP

## 9.1 Autenticação

O usuário deve conseguir:

- Criar conta.
- Fazer login.
- Recuperar senha.
- Permanecer logado.
- Fazer logout.
- Editar dados básicos do perfil.

Campos:

- Nome.
- E-mail.
- Senha.
- Foto de perfil opcional.
- Bio opcional.

Critérios de aceite:

- Usuário consegue se cadastrar.
- Usuário consegue fazer login.
- Usuário autenticado acessa o app.
- Usuário consegue sair da conta.
- Um profile é criado automaticamente no banco após cadastro.

---

## 9.2 Onboarding

Após o primeiro login, caso o usuário não participe de nenhum grupo, o sistema deve exibir uma tela de boas-vindas.

Ações disponíveis:

- Criar novo grupo.
- Entrar em grupo existente por código/link.

Critérios de aceite:

- Usuário sem grupo não cai em uma tela vazia.
- Usuário consegue criar grupo.
- Usuário consegue entrar em grupo por código.
- Após entrar ou criar grupo, usuário vai para o dashboard.

---

## 9.3 Grupos/desafios

O sistema deve permitir criar grupos de desafio.

Exemplos:

- Desafio Quaresma.
- Mês Mariano.
- Advento.
- 30 dias de oração.
- Grupo de jovens.
- Amigos da paróquia.
- Caminhada de São José.

Campos:

- Nome.
- Descrição.
- Imagem/capa opcional.
- Data de início.
- Data de fim.
- Código/link de convite.
- Criador.
- Administradores.
- Participantes.

Permissões:

- Criador vira admin.
- Admin pode editar grupo.
- Admin pode configurar atividades.
- Admin pode alterar pontuação.
- Admin pode remover membros.
- Participante pode sair do grupo.

Critérios de aceite:

- Usuário cria grupo.
- Grupo recebe código único.
- Criador entra automaticamente como admin.
- Atividades padrão são criadas automaticamente.
- Usuário entra em grupo por código.

---

## 9.4 Tipos de atividades cristãs

Atividades iniciais sugeridas:

| Atividade | Pontos | Limite |
|---|---:|---|
| Oração pessoal | 5 | 1 por dia |
| Leitura bíblica | 5 | 1 por dia |
| Terço | 10 | 1 por dia |
| Santa Missa | 20 | 1 por dia |
| Adoração | 15 | 1 por dia |
| Pregação/Formação | 10 | 2 por semana |
| Vigília | 25 | 1 por semana |
| Ato de caridade | 15 | 1 por dia |
| Jejum/Penitência | 10 | 1 por dia |

Observação:

Atividades mais pessoais, como jejum, penitência ou confissão, devem poder ser privadas por padrão.

Critérios de aceite:

- Cada grupo possui atividades próprias.
- Admin pode ativar/desativar atividades.
- Admin pode alterar pontos.
- Admin pode configurar limite diário/semanal.
- Algumas atividades podem ser privadas por padrão.

---

## 9.5 Check-ins

O check-in é a ação principal do app.

Campos:

- Grupo.
- Tipo de atividade.
- Título.
- Descrição/reflexão opcional.
- Data/hora.
- Duração opcional.
- Imagem opcional.
- Visibilidade pública ou privada.
- Pontuação calculada.
- Status.

Fluxo:

1. Usuário toca no botão de check-in.
2. Seleciona atividade.
3. Preenche título.
4. Adiciona descrição, duração ou imagem, se desejar.
5. Escolhe visibilidade.
6. Confirma.
7. Sistema valida limites.
8. Sistema calcula pontos.
9. Check-in é salvo.
10. Feed, dashboard e ranking são atualizados.

Critérios de aceite:

- Usuário cria check-in em poucos toques.
- Pontuação é calculada automaticamente.
- Limites são respeitados.
- Check-in privado não aparece no feed.
- Check-in público aparece no feed do grupo.
- Usuário recebe feedback de sucesso ou erro.

---

## 9.6 Dashboard / Hoje

Tela inicial do app após login.

Deve mostrar:

- Saudação pelo nome.
- Grupo ativo.
- Botão principal de check-in.
- Check-ins de hoje.
- Pontos da semana.
- Posição no ranking.
- Sequência atual.
- Resumo da caminhada espiritual.
- Últimas atividades.

Exemplo de microcopy:

- “Como está sua caminhada hoje?”
- “Registre um momento de fé.”
- “Sua constância está crescendo.”

Critérios de aceite:

- Usuário visualiza resumo ao abrir app.
- Ação de check-in é destacada.
- Tela é otimizada para mobile.
- Estados vazios são claros e motivadores.

---

## 9.7 Feed do grupo

O feed mostra check-ins públicos dos participantes.

Cada card deve exibir:

- Avatar.
- Nome.
- Tipo de atividade.
- Título.
- Descrição curta.
- Data/hora.
- Pontos.
- Imagem opcional.

Critérios de aceite:

- Feed lista check-ins públicos.
- Check-ins privados não aparecem.
- Layout em cards mobile-first.
- Feed tem paginação ou infinite scroll.
- Usuário pode ver detalhes do check-in.

---

## 9.8 Ranking

Rankings necessários no MVP:

- Semanal.
- Mensal.
- Geral.

Dados exibidos:

- Posição.
- Nome.
- Avatar.
- Pontos.
- Total de check-ins.
- Destaque para usuário logado.

Critérios de aceite:

- Ranking atualiza com check-ins válidos.
- Usuário alterna entre períodos.
- Usuário vê sua posição destacada.
- Layout é lista/card, não tabela.

---

## 9.9 Caminhada espiritual

Tela focada no progresso pessoal, sem comparação direta.

Dados:

- Dias com check-in no mês.
- Total por tipo de atividade.
- Sequência atual.
- Sequência máxima.
- Calendário simples de constância.
- Atividade mais praticada.
- Evolução semanal/mensal.

Critérios de aceite:

- Usuário vê sua evolução pessoal.
- Interface é motivadora.
- Não transmite cobrança excessiva.
- Valoriza constância mais do que competição.

---

## 9.10 Perfil

Tela do usuário com:

- Foto.
- Nome.
- Bio.
- E-mail.
- Grupos.
- Estatísticas.
- Sequência atual.
- Total de check-ins.
- Total de pontos.
- Logout.

Critérios de aceite:

- Usuário edita dados básicos.
- Usuário vê estatísticas pessoais.
- Usuário consegue sair da conta.

---

## 9.11 Admin do grupo

Somente admins podem acessar.

Funções:

- Editar nome do grupo.
- Editar descrição.
- Gerenciar participantes.
- Remover participantes.
- Editar atividades.
- Alterar pontuação.
- Alterar limites.
- Ativar/desativar atividades.
- Copiar link/código de convite.

Critérios de aceite:

- Apenas admin visualiza tela administrativa.
- Admin edita dados do grupo.
- Admin configura atividades.
- Admin gerencia membros.

---

## 10. Funcionalidades pós-MVP

- Comentários nos check-ins.
- Reações nos check-ins.
- Notificações push.
- Badges/conquistas.
- Aprovação manual de check-ins.
- Desafios por equipe.
- Ranking por equipe.
- Relatórios exportáveis.
- Calendário completo de atividades.
- Check-ins recorrentes.
- Lembretes diários.
- Integração com leituras litúrgicas.
- Modo comunidade/paróquia.
- Página pública do desafio.

---

## 11. Regras de negócio

### Check-ins

- Cada check-in pertence a um usuário.
- Cada check-in pertence a um grupo.
- Cada check-in pertence a uma atividade.
- Check-ins públicos aparecem no feed.
- Check-ins privados contam pontos, mas não aparecem no feed público.
- Check-ins acima do limite não devem pontuar ou devem ser bloqueados.
- Check-ins removidos devem deixar de contar no ranking.
- Admin pode remover check-ins impróprios.

### Pontuação

- Cada atividade possui pontuação base.
- Pontuação pode variar por grupo.
- A pontuação do check-in deve ser salva no momento do registro.
- Mudanças futuras na atividade não devem alterar pontuações antigas automaticamente.
- Rankings consideram apenas check-ins válidos.

### Grupos

- Usuário pode participar de múltiplos grupos.
- Grupo tem um ou mais admins.
- Apenas admins alteram regras.
- Entrada via código/link.
- Dados do grupo são privados para membros.

### Privacidade

- Usuário pode criar check-ins privados.
- Atividades sensíveis podem ser privadas por padrão.
- Usuário só vê dados dos grupos em que participa.
- Dados espirituais não devem ser expostos fora do grupo.

---

## 12. Requisitos mobile-first

Obrigatórios:

- Layout responsivo.
- Bottom navigation fixa.
- Botão de check-in sempre acessível.
- Cards grandes.
- Inputs confortáveis.
- Evitar tabelas.
- Ranking em lista.
- Feedback visual após ações.
- Imagens otimizadas.
- PWA instalável.
- Ícone do app.
- Splash screen.
- Manifest configurado.
- Boa performance em conexão móvel.

---

## 13. Requisitos não funcionais

### Performance

- Carregamento rápido.
- Skeleton loading.
- Paginação no feed.
- Otimização de imagens.
- Consultas eficientes.

### Segurança

- Supabase Auth.
- RLS desde o início.
- Usuário só acessa seus grupos.
- Upload limitado por tamanho e tipo.
- Admin somente onde permitido.

### Escalabilidade

- Suporte a múltiplos grupos.
- Ranking calculado por período.
- Feed paginado.
- Separação clara entre entidades.

### Usabilidade

- Check-in em menos de 30 segundos.
- Interface simples.
- Estados de erro amigáveis.
- Textos curtos e motivadores.

---

## 14. Métricas de sucesso

- Usuários cadastrados.
- Grupos criados.
- Check-ins por dia.
- Usuários ativos diários.
- Usuários ativos semanais.
- Média de check-ins por usuário.
- Retenção semanal.
- Sequências ativas.
- Cumprimento de metas semanais.

---

## 15. Roadmap

### Fase 1 — MVP

- Auth.
- Profiles.
- Grupos.
- Atividades.
- Check-ins.
- Feed.
- Ranking.
- Dashboard.
- Perfil.
- PWA.

### Fase 2 — Engajamento

- Caminhada espiritual completa.
- Badges.
- Reações.
- Comentários.
- Lembretes.
- Calendário.

### Fase 3 — Administração

- Aprovação manual.
- Regras avançadas.
- Ranking por equipe.
- Relatórios.
- Exportação.

### Fase 4 — Expansão

- React Native/Expo, se necessário.
- Notificações nativas.
- Integrações.
- Modo comunidade/paróquia.

---

## 16. Direção visual

### Estilo

- Minimalista.
- Moderno.
- Mobile app feeling.
- Espiritual sem ser caricato.
- Inspirador.

### Elementos

- Cards arredondados.
- Ícones leves.
- Gradientes sutis.
- Tons suaves.
- Espaçamento generoso.
- Tipografia clara.

### Tom de voz

- Fraterno.
- Simples.
- Motivador.
- Espiritual.
- Sem cobrança excessiva.

Exemplos:

- “Como está sua caminhada hoje?”
- “Registre um momento de fé.”
- “Você está perseverando bem.”
- “Convide seus amigos para essa jornada.”

---

## 17. Critérios gerais de aceite do MVP

O MVP estará pronto quando:

- Usuário criar conta e entrar.
- Usuário criar ou entrar em grupo.
- Usuário registrar check-ins.
- Check-ins gerarem pontos corretamente.
- Ranking atualizar.
- Feed exibir check-ins públicos.
- Dashboard exibir resumo pessoal.
- Admin configurar atividades e pontos.
- App funcionar bem em celulares.
- App puder ser instalado como PWA.
- Usuários acessarem por link sem loja.
