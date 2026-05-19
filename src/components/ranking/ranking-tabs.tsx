"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { PageHeader } from "@/components/layout/page-header";
import { RankingList } from "@/components/ranking/ranking-list";
import type { GroupRanking, PeriodType } from "@/types/database";

const periods: { value: PeriodType; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "general", label: "Geral" },
];

export function RankingTabs({
  rankings,
  currentUserId,
  activePeriod,
}: {
  rankings: GroupRanking[];
  currentUserId: string;
  activePeriod: PeriodType;
}) {
  const pathname = usePathname();

  return (
    <div>
      <PageHeader title="Ranking" subtitle="Incentivo saudável entre amigos" />

      <div className="flex gap-2 mb-6 p-1 bg-surface-secondary rounded-xl">
        {periods.map((p) => (
          <Link
            key={p.value}
            href={`${pathname}?period=${p.value}`}
            className={cn(
              "flex-1 text-center py-2 rounded-lg text-sm font-medium transition-all",
              activePeriod === p.value
                ? "bg-surface text-primary shadow-sm"
                : "text-muted",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      <RankingList rankings={rankings} currentUserId={currentUserId} />
    </div>
  );
}
