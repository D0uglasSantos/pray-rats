"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createGroup } from "@/actions/groups";
import {
  createDefaultActivityDrafts,
  serializeActivityDrafts,
  validateActivityDrafts,
  type ActivityDraft,
} from "@/lib/activity-drafts";
import { ActivitySetupEditor } from "@/components/groups/activity-setup-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

interface GroupInfo {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
}

export function CreateGroupForm({ backHref = "/onboarding" }: { backHref?: string }) {
  const [step, setStep] = useState<"info" | "activities">("info");
  const [groupInfo, setGroupInfo] = useState<GroupInfo>({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [activities, setActivities] = useState<ActivityDraft[]>(
    createDefaultActivityDrafts,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInfoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = (formData.get("name") as string)?.trim();

    if (!name) {
      setError("Informe o nome do grupo.");
      return;
    }

    setGroupInfo({
      name,
      description: (formData.get("description") as string)?.trim() ?? "",
      start_date: (formData.get("start_date") as string) ?? "",
      end_date: (formData.get("end_date") as string) ?? "",
    });
    setStep("activities");
  }

  function handleCreateGroup() {
    setError(null);

    const validationError = validateActivityDrafts(serializeActivityDrafts(activities));
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    formData.set("name", groupInfo.name);
    formData.set("description", groupInfo.description);
    formData.set("start_date", groupInfo.start_date);
    formData.set("end_date", groupInfo.end_date);
    formData.set("activities", JSON.stringify(serializeActivityDrafts(activities)));

    startTransition(async () => {
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

        <p className="text-xs uppercase tracking-wide text-muted mb-2">
          Passo {step === "info" ? "1" : "2"} de 2
        </p>
        <h1 className="text-2xl font-bold mb-2">
          {step === "info" ? "Criar grupo" : "Atividades do check-in"}
        </h1>
        <p className="text-muted text-sm mb-6">
          {step === "info"
            ? "Inicie um desafio espiritual com seus amigos."
            : "Personalize as atividades antes de finalizar. Você poderá editar depois no admin do grupo."}
        </p>

        {step === "info" ? (
          <form onSubmit={handleInfoSubmit} className="space-y-4">
            <Input
              name="name"
              label="Nome do grupo"
              placeholder="Ex: Desafio Quaresma"
              defaultValue={groupInfo.name}
              required
              maxLength={120}
            />
            <Textarea
              name="description"
              label="Descrição (opcional)"
              placeholder="Descreva o propósito do desafio..."
              defaultValue={groupInfo.description}
            />
            <Input
              name="start_date"
              type="date"
              label="Data de início"
              defaultValue={groupInfo.start_date}
            />
            <Input
              name="end_date"
              type="date"
              label="Data de fim"
              defaultValue={groupInfo.end_date}
            />
            {error && (
              <p className="text-sm text-error text-center">{error}</p>
            )}
            <Button type="submit" fullWidth>
              Continuar
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <ActivitySetupEditor
              activities={activities}
              onChange={setActivities}
              disabled={isPending}
            />

            {error && (
              <p className="text-sm text-error text-center">{error}</p>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                disabled={isPending}
                onClick={() => {
                  setError(null);
                  setStep("info");
                }}
              >
                Voltar
              </Button>
              <Button
                type="button"
                fullWidth
                loading={isPending}
                onClick={handleCreateGroup}
              >
                Criar grupo
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
