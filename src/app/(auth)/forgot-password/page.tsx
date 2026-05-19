import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-2">Recuperar senha</h2>
      <p className="text-sm text-muted text-center mb-6">
        Informe seu e-mail para receber o link de recuperação.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
