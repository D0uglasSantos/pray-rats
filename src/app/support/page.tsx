import type { Metadata } from "next";
import Link from "next/link";
import { DocumentList, DocumentSection, PublicDocument } from "@/components/legal/public-document";
import { buildSupportMailto, getSupportEmail } from "@/lib/support-contact";

export const metadata: Metadata = {
  title: "Suporte — PrayRats",
  description: "Ajuda, privacidade e gerenciamento da conta PrayRats.",
};

export default function SupportPage() {
  const supportEmail = getSupportEmail();

  return (
    <PublicDocument
      title="Suporte"
      description="Encontre os caminhos oficiais para ajuda, privacidade e gerenciamento da conta."
      updatedAt="6 de outubro de 2026"
    >
      <DocumentSection title="Como pedir ajuda">
        <p>
          Envie um e-mail para{" "}
          <a
            className="font-semibold text-primary hover:underline"
            href={buildSupportMailto(supportEmail)}
          >
            {supportEmail}
          </a>
          . Não envie sua senha, tokens ou chaves de acesso.
        </p>
        <p>
          Para agilizar, informe versão do app, Android/iOS ou navegador, passos realizados e a
          mensagem exibida. Evite anexar conteúdo pessoal que não seja necessário.
        </p>
      </DocumentSection>

      <DocumentSection title="Autoatendimento da conta">
        <DocumentList>
          <li>senha: use “Esqueci minha senha” na tela de login;</li>
          <li>notificações: altere as preferências no Perfil e nos Ajustes do aparelho;</li>
          <li>perfil e grupos: use as opções disponíveis dentro do aplicativo;</li>
          <li>
            exclusão definitiva: acesse{" "}
            <Link href="/account-deletion" className="font-semibold text-primary hover:underline">
              Exclusão de conta e dados
            </Link>
            .
          </li>
        </DocumentList>
      </DocumentSection>

      <DocumentSection title="Privacidade e segurança">
        <p>
          Solicitações sobre acesso, correção, exclusão ou tratamento de dados usam o mesmo canal de
          suporte. Nunca pediremos sua senha completa por e-mail.
        </p>
      </DocumentSection>
    </PublicDocument>
  );
}
