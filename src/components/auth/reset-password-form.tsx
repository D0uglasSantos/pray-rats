"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  if (pw.length < 8) return 1;
  const hasUpper = /[A-Z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = (hasUpper ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (pw.length >= 8 && score >= 2) return 3;
  if (score >= 1) return 2;
  return 1;
}

const strengthConfig = [
  null,
  { label: "Fraca", color: "bg-error" },
  { label: "Média", color: "bg-yellow-400" },
  { label: "Forte", color: "bg-success" },
] as const;

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const { showToast } = useToast();
  const router = useRouter();

  const strength = getPasswordStrength(password);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const confirm = formData.get("confirm") as string;
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      showToast("As senhas não coincidem.", "error");
      setLoading(false);
      return;
    }

    const result = await updatePassword(formData);
    if (result.success) {
      showToast("Senha atualizada com sucesso!", "success");
      router.push("/home");
      router.refresh();
      return;
    }

    setError(result.error);
    showToast(result.error, "error");
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted text-center">
        Escolha uma nova senha para sua conta.
      </p>
      <div className="space-y-2">
        <Input
          name="password"
          type="password"
          label="Nova senha"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {password.length > 0 && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    strength >= level
                      ? strengthConfig[strength]?.color
                      : "bg-border",
                  )}
                />
              ))}
            </div>
            <p className="text-xs text-muted">
              Senha {strengthConfig[strength]?.label?.toLowerCase()}
            </p>
          </div>
        )}
      </div>
      <Input
        name="confirm"
        type="password"
        label="Confirmar senha"
        placeholder="Repita a nova senha"
        required
        minLength={8}
        autoComplete="new-password"
      />
      {error && <p className="text-sm text-error text-center">{error}</p>}
      <Button type="submit" fullWidth loading={loading}>
        Salvar nova senha
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-primary hover:underline">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
