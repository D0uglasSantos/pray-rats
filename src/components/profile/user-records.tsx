import { Flame, Clock, Moon, Sun, Calendar } from "lucide-react";
import { formatHourLabel, type UserRecords } from "@/lib/user-records";
import { Card } from "@/components/ui/card";

interface UserRecordsSectionProps {
  records: UserRecords;
}

function RecordItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <Icon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}

export function UserRecordsSection({ records }: UserRecordsSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">Meus recordes</h3>

      <Card padding="sm">
        <p className="text-xs font-medium text-muted uppercase mb-2">Constância</p>
        <RecordItem
          icon={Flame}
          label="Melhor sequência"
          value={`${records.bestStreak} ${records.bestStreak === 1 ? "dia" : "dias"}`}
        />
        <RecordItem
          icon={Flame}
          label="Sequência atual"
          value={`${records.currentStreak} ${records.currentStreak === 1 ? "dia" : "dias"}`}
        />
        {records.bestMonth && (
          <RecordItem
            icon={Calendar}
            label="Melhor mês"
            value={`${records.bestMonth.name} (${records.bestMonth.count} check-ins)`}
          />
        )}
      </Card>

      <Card padding="sm">
        <p className="text-xs font-medium text-muted uppercase mb-2">Horários</p>
        {records.mostActiveWeekday && (
          <RecordItem
            icon={Calendar}
            label="Dia da semana mais ativo"
            value={`${records.mostActiveWeekday.name} (${records.mostActiveWeekday.count}x)`}
          />
        )}
        {records.mostActiveHour && (
          <RecordItem
            icon={Clock}
            label="Hora mais ativa"
            value={`${formatHourLabel(records.mostActiveHour.hour)} (${records.mostActiveHour.count}x)`}
          />
        )}
        <RecordItem
          icon={Sun}
          label="Check-ins de dia (6h–18h)"
          value={String(records.dayCheckins)}
        />
        <RecordItem
          icon={Moon}
          label="Check-ins de noite"
          value={String(records.nightCheckins)}
        />
      </Card>
    </div>
  );
}
