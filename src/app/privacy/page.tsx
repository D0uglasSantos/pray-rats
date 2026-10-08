import type { Metadata } from "next";
import {
  DocumentList,
  DocumentSection,
  PublicDocument,
} from "@/components/legal/public-document";

export const metadata: Metadata = {
  title: "Política de Privacidade — PrayRats",
  description: "Saiba quais dados o PrayRats trata e como controlar sua conta.",
};

export default async function PrivacyPage() {
  return (
    <PublicDocument
      title="Política de Privacidade"
      description="Esta política descreve o tratamento de dados no site, PWA e aplicativos Android e iOS do PrayRats."
      updatedAt="14 de setembro de 2026"
    >
      <DocumentSection title="1. Quem é responsável">
        <p>
          O PrayRats é responsável pelas decisões sobre os dados tratados no aplicativo. O canal
          oficial para dúvidas, solicitações de privacidade e exercício de direitos está na página
          de Suporte.
        </p>
      </DocumentSection>

      <DocumentSection title="2. Dados tratados">
        <DocumentList>
          <li>conta e perfil: nome, e-mail, senha processada pelo provedor de autenticação, bio e avatar;</li>
          <li>grupos e relações: grupos, convites, papéis, seguidores, seguindo e amizades;</li>
          <li>conteúdo: check-ins, fotos, títulos, descrições, comentários e reações;</li>
          <li>atividade: data e hora, duração, distância informada, pontos, sequência e ranking;</li>
          <li>notificações: preferências, fuso horário, token push, plataforma, versão e identificador aleatório da instalação;</li>
          <li>segurança e diagnóstico: tentativas limitadas por identificador derivado, falhas, versão do app e contexto técnico sem captura de tela.</li>
        </DocumentList>
        <p>
          O PrayRats não solicita contatos, localização precisa nem microfone. A distância de uma
          atividade é digitada pelo usuário e não obtida por GPS.
        </p>
      </DocumentSection>

      <DocumentSection title="3. Para que usamos os dados">
        <DocumentList>
          <li>criar e proteger a conta, restaurar sessão e recuperar senha;</li>
          <li>operar grupos, check-ins, histórico, feed, interações, pontuação e ranking;</li>
          <li>enviar notificações e lembretes quando o usuário fizer opt-in;</li>
          <li>prevenir abuso, aplicar limites e investigar falhas técnicas;</li>
          <li>medir uso agregado do PWA para melhorar estabilidade e experiência.</li>
        </DocumentList>
        <p>Não vendemos dados pessoais e não usamos publicidade comportamental.</p>
      </DocumentSection>

      <DocumentSection title="4. Visibilidade e compartilhamento">
        <p>
          Nome, avatar, bio, relações e conteúdo social podem ser exibidos a integrantes de grupos
          compartilhados e a pessoas conectadas, conforme as regras do produto. Check-ins privados
          ficam limitados aos contextos autorizados pelo backend.
        </p>
        <p>
          Avatares e fotos de check-in ficam em armazenamento privado. O aplicativo gera links
          temporários apenas após verificar a sessão e, para fotos de check-in, a relação do usuário
          com o grupo e a visibilidade escolhida. Evite publicar imagens sensíveis desnecessárias.
        </p>
      </DocumentSection>

      <DocumentSection title="5. Provedores">
        <DocumentList>
          <li>Supabase: autenticação, banco de dados, arquivos e backups;</li>
          <li>Vercel: hospedagem, logs técnicos e métricas web agregadas;</li>
          <li>Expo/EAS, Firebase Cloud Messaging e Apple Push Notification service: build e entrega de notificações;</li>
          <li>Sentry: diagnóstico de erros, quando configurado, sem PII padrão, replay, screenshot ou hierarquia visual;</li>
          <li>provedores de e-mail e do sistema operacional necessários para autenticação e notificações.</li>
        </DocumentList>
        <p>Esses provedores podem processar dados em outros países conforme seus contratos e políticas.</p>
      </DocumentSection>

      <DocumentSection title="6. Permissões do aparelho">
        <p>
          Câmera e fotos são acessadas somente após uma ação do usuário para escolher uma imagem.
          Notificações são opcionais e solicitadas após contexto no Perfil. A recusa não impede o
          uso das funções principais, e permissões podem ser alteradas nos Ajustes do aparelho.
        </p>
      </DocumentSection>

      <DocumentSection title="7. Retenção e exclusão">
        <p>
          Dados de produto permanecem enquanto a conta estiver ativa ou enquanto forem necessários
          para prestar o serviço. Tickets técnicos de push não guardam o conteúdo da notificação,
          expiram em até 24 horas e seus resultados são removidos após sete dias.
        </p>
        <p>
          A exclusão definitiva pode ser iniciada no Perfil ou em “Excluir conta”. Ela remove conta,
          perfil, conteúdo próprio, relações, preferências e tokens. Grupos com outros integrantes
          recebem um novo administrador; grupos sem sucessor são excluídos. Backups e logs mínimos
          seguem os ciclos dos provedores e deixam de ficar disponíveis no produto.
        </p>
      </DocumentSection>

      <DocumentSection title="8. Segurança e controle">
        <p>
          Aplicamos controle de acesso no banco, conexões criptografadas, separação de segredos e
          minimização de telemetria. Nenhum sistema é totalmente imune a falhas; em caso de incidente
          relevante, serão adotadas as medidas exigidas pela legislação aplicável.
        </p>
        <p>
          O usuário pode atualizar perfil e preferências, revogar notificações, sair de grupos e
          excluir a conta. Para acesso, correção ou outras solicitações, use o canal de Suporte.
        </p>
      </DocumentSection>

      <DocumentSection title="9. Alterações desta política">
        <p>
          Mudanças materiais serão publicadas nesta página com nova data de atualização e, quando
          necessário, comunicadas dentro do produto.
        </p>
      </DocumentSection>
    </PublicDocument>
  );
}
