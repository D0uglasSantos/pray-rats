"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils/cn";
import {
  DAILY_LIMIT_OPTIONS,
  WEEKLY_LIMIT_OPTIONS,
  limitToSelectValue,
  selectValueToLimit,
  type ActivityFormValues,
} from "@/lib/activity-display";

interface ActivityFormProps {
  values: ActivityFormValues;
  onChange: (values: ActivityFormValues) => void;
  disabled?: boolean;
  mode: "create" | "edit";
}

function LimitSelect({
  id,
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const knownValues = new Set(options.map((option) => option.value));
  const displayOptions =
    value && !knownValues.has(value)
      ? [...options, { value, label: `${value} check-ins` }]
      : options;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full h-12 px-4 rounded-xl border border-border bg-surface text-base",
          "outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary",
          "transition-colors disabled:opacity-50",
        )}
      >
        {displayOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ActivityForm({
  values,
  onChange,
  disabled = false,
  mode,
}: ActivityFormProps) {
  function patch(partial: Partial<ActivityFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Informações básicas</h3>
        <Input
          label="Nome"
          value={values.name}
          disabled={disabled}
          placeholder="Ex: Oração em família"
          onChange={(event) => patch({ name: event.target.value })}
          required
        />
        <Textarea
          label="Descrição"
          value={values.description ?? ""}
          disabled={disabled}
          rows={3}
          placeholder="Breve descrição da atividade para os participantes"
          onChange={(event) =>
            patch({ description: event.target.value.trim() || null })
          }
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Pontuação e limites</h3>
        <Input
          type="number"
          label="Pontuação"
          min={0}
          value={values.points}
          disabled={disabled}
          onChange={(event) => patch({ points: Number(event.target.value) })}
        />
        <LimitSelect
          id={`${mode}-daily-limit`}
          label="Limite diário"
          value={limitToSelectValue(values.daily_limit)}
          options={DAILY_LIMIT_OPTIONS}
          disabled={disabled}
          onChange={(value) => patch({ daily_limit: selectValueToLimit(value) })}
        />
        <LimitSelect
          id={`${mode}-weekly-limit`}
          label="Limite semanal"
          value={limitToSelectValue(values.weekly_limit)}
          options={WEEKLY_LIMIT_OPTIONS}
          disabled={disabled}
          onChange={(value) => patch({ weekly_limit: selectValueToLimit(value) })}
        />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Configurações</h3>
        <Switch
          label="Atividade disponível"
          description="Quando desativada, não aparece nas opções de check-in."
          checked={values.is_active}
          disabled={disabled}
          onCheckedChange={(checked) => patch({ is_active: checked })}
        />
        <Switch
          label="Check-in privado por padrão"
          description="Novos check-ins começam como privados. O participante ainda pode alterar a visibilidade."
          checked={values.is_private_default}
          disabled={disabled}
          onCheckedChange={(checked) => patch({ is_private_default: checked })}
        />
      </section>
    </div>
  );
}
