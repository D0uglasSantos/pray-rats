"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createGroup } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

export function CreateGroupForm({ backHref = "/onboarding" }: { backHref?: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const result = await createGroup(formData);
      if (!result.success) {
        setError(result.error);
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

        <h1 className="text-2xl font-bold mb-2">Criar grupo</h1>
        <p className="text-muted text-sm mb-6">
          Inicie um desafio espiritual com seus amigos.
        </p>

        <form action={handleSubmit} className="space-y-4">
          <Input
            name="name"
            label="Nome do grupo"
            placeholder="Ex: Desafio Quaresma"
            required
            maxLength={120}
          />
          <Textarea
            name="description"
            label="Descrição (opcional)"
            placeholder="Descreva o propósito do desafio..."
          />
          <Input name="start_date" type="date" label="Data de início" />
          <Input name="end_date" type="date" label="Data de fim" />
          {error && (
            <p className="text-sm text-error text-center">{error}</p>
          )}
          <Button type="submit" fullWidth loading={isPending}>
            Criar grupo
          </Button>
        </form>
      </div>
    </div>
  );
}
