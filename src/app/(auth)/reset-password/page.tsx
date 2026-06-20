import { Suspense } from "react";
import { ResetPasswordSessionGate } from "@/components/auth/reset-password-session-gate";

export default function ResetPasswordPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Nova senha</h2>
      <Suspense
        fallback={
          <p className="text-sm text-muted text-center">
            Validando link de recuperação…
          </p>
        }
      >
        <ResetPasswordSessionGate />
      </Suspense>
    </div>
  );
}
