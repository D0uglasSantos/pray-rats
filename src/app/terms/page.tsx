import type { Metadata } from "next";
import {
  DocumentList,
  DocumentSection,
  PublicDocument,
} from "@/components/legal/public-document";

export const metadata: Metadata = {
  title: "Termos de Uso — PrayRats",
  description: "Condições para criar uma conta e usar o PrayRats.",
};

export default async function TermsPage() {
  return (
    <PublicDocument
      title="Termos de Uso"
      description="Estas condições se aplicam ao site, PWA e aplicativos Android e iOS do PrayRats."
      updatedAt="14 de setembro de 2026"
    >
      <DocumentSection title="1. Aceitação e conta">
        <p>
          Ao criar uma conta ou usar o PrayRats, você declara que leu estes Termos e a Política de
          Privacidade. Forneça dados corretos, proteja sua senha e avise o Suporte sobre uso não autorizado.
        </p>
      </DocumentSection>

      <DocumentSection title="2. Finalidade do PrayRats">
        <p>
          O PrayRats ajuda pessoas e grupos a registrar práticas de fé, acompanhar constância e
          interagir em comunidade. Pontos, sequências e rankings são recursos motivacionais, não
          possuem valor financeiro e não representam avaliação religiosa, moral ou profissional.
        </p>
      </DocumentSection>

      <DocumentSection title="3. Uso responsável">
        <DocumentList>
          <li>não publique conteúdo ilegal, ofensivo, discriminatório, fraudulento ou que viole direitos de terceiros;</li>
          <li>não tente acessar contas, grupos, dados ou infraestrutura sem autorização;</li>
          <li>não use automação abusiva, engenharia reversa indevida ou meios que prejudiquem o serviço;</li>
          <li>respeite integrantes, administradores de grupo, propriedade intelectual e direito de imagem.</li>
        </DocumentList>
        <p>
          Conteúdo ou contas podem ser restringidos quando necessário para segurança, cumprimento
          legal ou proteção da comunidade, com análise proporcional ao caso.
        </p>
      </DocumentSection>

      <DocumentSection title="4. Seu conteúdo e privacidade">
        <p>
          Você mantém a responsabilidade pelo conteúdo que envia e declara possuir autorização
          para publicá-lo. Concede ao PrayRats a permissão técnica necessária para armazenar,
          processar e exibir esse conteúdo somente para operar o serviço conforme a visibilidade escolhida.
        </p>
      </DocumentSection>

      <DocumentSection title="5. Disponibilidade e mudanças">
        <p>
          O serviço pode passar por manutenção, indisponibilidade ou evolução. Buscamos preservar os
          dados e avisar sobre mudanças relevantes, mas não garantimos operação ininterrupta nem que
          todo recurso experimental será mantido.
        </p>
      </DocumentSection>

      <DocumentSection title="6. Saúde, segurança e orientação">
        <p>
          O PrayRats não substitui orientação médica, psicológica, jurídica, pastoral ou de emergência.
          Em situações de risco, procure profissionais e serviços adequados. Atividades físicas devem
          respeitar suas condições e recomendações profissionais.
        </p>
      </DocumentSection>

      <DocumentSection title="7. Encerramento e exclusão">
        <p>
          Você pode parar de usar o serviço e excluir a conta pelo Perfil. Violações graves ou riscos
          à segurança podem levar à suspensão ou ao encerramento, observadas as regras aplicáveis.
          Os efeitos da exclusão e a retenção técnica estão descritos na Política de Privacidade.
        </p>
      </DocumentSection>

      <DocumentSection title="8. Serviços de terceiros">
        <p>
          Partes da operação dependem de provedores de autenticação, nuvem, armazenamento,
          notificações e diagnóstico. A disponibilidade desses serviços também está sujeita aos
          respectivos termos e políticas.
        </p>
      </DocumentSection>

      <DocumentSection title="9. Responsabilidade e legislação">
        <p>
          Dentro dos limites permitidos pela legislação, o PrayRats responde pelo serviço que fornece,
          mas não por uso contrário a estes Termos, conteúdo de usuários ou eventos fora de seu controle razoável.
          A legislação aplicável e os direitos obrigatórios do consumidor permanecem preservados.
        </p>
      </DocumentSection>

      <DocumentSection title="10. Contato e alterações">
        <p>
          Dúvidas podem ser enviadas pelo canal de Suporte. Mudanças materiais serão publicadas com
          nova data e comunicadas quando necessário.
        </p>
      </DocumentSection>
    </PublicDocument>
  );
}
