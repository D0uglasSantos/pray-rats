"use client";

import { useState } from "react";
import Link from "next/link";
import { signUp } from "@/actions/auth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 1;
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

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const { showToast } = useToast();

  const strength = getPasswordStrength(password);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    const result = await signUp(formData);
    if (!result.success) {
      setError(result.error);
      showToast(result.error, "error");
    } else if (result.needsEmailConfirmation) {
      setSuccess(
        "Conta criada! Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada e spam.",
      );
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <p className="text-foreground">{success}</p>
        <Link href="/login" className="text-primary font-medium hover:underline text-sm">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input
        name="name"
        type="text"
        label="Nome"
        placeholder="Seu nome"
        required
        autoComplete="name"
      />
      <Input
        name="email"
        type="email"
        label="E-mail"
        placeholder="seu@email.com"
        required
        autoComplete="email"
      />
      <div className="space-y-2">
        <Input
          name="password"
          type="password"
          label="Senha"
          placeholder="Mínimo 6 caracteres"
          required
          minLength={6}
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
              {strength === 1 && " — use ao menos 6 caracteres"}
              {strength === 2 && " — adicione maiúsculas ou símbolos para fortalecer"}
            </p>
          </div>
        )}
      </div>
      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}
      <Button type="submit" fullWidth loading={loading}>
        Criar conta
      </Button>
      <p className="text-center text-sm text-muted">
        Já tem conta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
