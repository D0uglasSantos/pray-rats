import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h2 className="text-xl font-semibold text-center mb-6">Nova senha</h2>
      <ResetPasswordForm />
    </div>
  );
}
