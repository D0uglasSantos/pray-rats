import { Activity, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

export function GroupStats({
  totalCheckins,
  avgCheckinsPerDay,
}: {
  totalCheckins: number;
  avgCheckinsPerDay: number;
}) {
  return (
    <section>
      <h2 className="font-semibold mb-3">Estatísticas do grupo</h2>
      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-accent shrink-0" />
          <div>
            <p className="text-2xl font-bold text-primary">{totalCheckins}</p>
            <p className="text-xs text-muted">Check-ins totais</p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-2xl font-bold text-primary">{avgCheckinsPerDay}</p>
            <p className="text-xs text-muted">Média por dia</p>
          </div>
        </Card>
      </div>
    </section>
  );
}
