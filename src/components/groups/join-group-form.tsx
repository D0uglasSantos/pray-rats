"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { joinGroupByCode } from "@/actions/groups";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

export function JoinGroupForm({
  initialCode,
  backHref = "/onboarding",
}: {
  initialCode?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  function handleSubmit(formData: FormData) {
    const code = formData.get("invite_code") as string;
    startTransition(async () => {
      setError(null);
      const result = await joinGroupByCode(code);
      if (result.success) {
        router.push("/groups");
      } else {
        setError(result.error);
        showToast(result.error, "error");
      }
    });
  }

  return (
    <div className="min-h-screen gradient-subtle px-4 py-8">
      <div className="max-w-sm mx-auto">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-muted mb-6"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold mb-2">Entrar em grupo</h1>
        <p className="text-muted text-sm mb-6">
          Digite o código de convite que você recebeu.
        </p>

        <form action={handleSubmit} className="space-y-4">
          <Input
            name="invite_code"
            label="Código de convite"
            placeholder="Ex: ABCD1234"
            defaultValue={initialCode ?? ""}
            required
            className="uppercase tracking-widest text-center font-mono"
          />
          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}
          <Button type="submit" fullWidth loading={isPending}>
            Entrar no grupo
          </Button>
        </form>
      </div>
    </div>
  );
}
