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

      <div className="flex border-b border-border mb-6">
        {periods.map((p) => (
          <Link
            key={p.value}
            href={`${pathname}?period=${p.value}`}
            className={cn(
              "flex-1 text-center pb-3 text-sm font-medium transition-colors relative",
              activePeriod === p.value
                ? "text-primary"
                : "text-muted hover:text-foreground",
            )}
          >
            {p.label}
            {activePeriod === p.value && (
              <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 rounded-full bg-primary" />
            )}
          </Link>
        ))}
      </div>

      <RankingList rankings={rankings} currentUserId={currentUserId} />
    </div>
  );
}
