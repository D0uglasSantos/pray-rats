import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createClient } from "@/lib/supabase/server";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_code?: string;
  }>;
};

function ResetPasswordError({ message }: { message: string }) {
  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-error">{message}</p>
      <Link
        href="/forgot-password"
        className="text-primary font-medium hover:underline text-sm"
      >
        Solicitar novo link
      </Link>
    </div>
  );
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const authError = params.error_code ?? params.error;

  if (authError === "otp_expired") {
    return (
      <ResetPasswordError message="Este link expirou ou já foi usado. Solicite um novo e-mail de recuperação." />
    );
  }

  if (authError) {
    return (
      <ResetPasswordError message="Não foi possível validar o link de recuperação. Tente novamente." />
    );
  }

  if (params.code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      return (
        <ResetPasswordError message="Link inválido ou expirado. Solicite um novo e-mail de recuperação." />
      );
    }

    redirect("/reset-password");
  }

  const user = await getSessionUser();
  if (!user) {
    return (
      <ResetPasswordError message="Sessão não encontrada. Abra o link mais recente do e-mail (no mesmo navegador em que pediu a recuperação) ou solicite um novo." />
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Nova senha</h2>
      <ResetPasswordForm />
    </div>
  );
}
