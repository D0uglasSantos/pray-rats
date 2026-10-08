import Link from "next/link";
import { getSessionUser } from "@/actions/auth";
import { AccountDeletionForm } from "@/components/account/account-deletion-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const metadata = {
  title: "Exclusão de conta — PrayRats",
  description: "Exclua sua conta PrayRats e os dados associados.",
};

export default async function AccountDeletionPage() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg space-y-6 px-4 py-10">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-primary">PrayRats</p>
        <h1 className="text-2xl font-bold">Exclusão de conta e dados</h1>
        <p className="text-sm text-muted">
          Este fluxo remove definitivamente sua conta e os dados pessoais associados.
        </p>
      </div>

      <Card className="space-y-3">
        <h2 className="font-semibold">O que será removido</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          <li>perfil, credenciais e sessões;</li>
          <li>check-ins, fotos, comentários, reações e relações sociais;</li>
          <li>notificações, tokens e preferências de lembrete.</li>
        </ul>
        <p className="text-sm text-muted">
          Grupos com outros integrantes continuam ativos e recebem um novo administrador. Grupos sem outro integrante são excluídos.
        </p>
      </Card>

      {user?.email ? (
        <Card className="space-y-4 border-error/30">
          <div className="space-y-1">
            <h2 className="font-semibold text-error">Ação irreversível</h2>
            <p className="text-sm text-muted">Conta: {user.email}</p>
          </div>
          <AccountDeletionForm email={user.email} />
        </Card>
      ) : (
        <Card className="space-y-3">
          <p className="text-sm text-muted">
            Entre na sua conta para confirmar sua identidade e concluir a exclusão pelo navegador.
          </p>
          <Link href="/login?redirect=/account-deletion">
            <Button fullWidth>Entrar para excluir a conta</Button>
          </Link>
        </Card>
      )}

      <p className="text-xs text-muted">
        Backups técnicos e registros mínimos de segurança seguem os ciclos dos provedores e não permanecem disponíveis no produto.
      </p>
      <p className="text-xs text-muted">
        Consulte também a{" "}
        <Link href="/privacy" className="font-medium text-primary hover:underline">
          Política de Privacidade
        </Link>{" "}
        ou fale com o{" "}
        <Link href="/support" className="font-medium text-primary hover:underline">
          Suporte
        </Link>
        .
      </p>
    </main>
  );
}
