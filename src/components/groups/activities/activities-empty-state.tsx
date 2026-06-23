import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { ListChecks, Plus, SearchX } from "lucide-react";

interface ActivitiesEmptyStateProps {
  variant: "none" | "search";
  onCreate?: () => void;
}

export function ActivitiesEmptyState({ variant, onCreate }: ActivitiesEmptyStateProps) {
  if (variant === "search") {
    return (
      <EmptyState
        icon={SearchX}
        title="Nenhuma atividade encontrada"
        description="Tente outro termo de busca ou ajuste os filtros."
        className="py-10"
      />
    );
  }

  return (
    <EmptyState
      icon={ListChecks}
      title="Nenhuma atividade configurada"
      description="Crie atividades como oração, missa, leitura bíblica ou jejum para começar os check-ins do grupo."
      action={
        onCreate ? (
          <Button type="button" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Criar primeira atividade
          </Button>
        ) : undefined
      }
      className="py-10"
    />
  );
}
