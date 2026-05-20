import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { memberProfilePath } from "@/lib/member-profile-path";
import { cn } from "@/lib/utils/cn";
import type { GroupRanking } from "@/types/database";
import { Medal } from "lucide-react";

export function RankingList({
  rankings,
  currentUserId,
}: {
  rankings: GroupRanking[];
  currentUserId: string;
}) {
  if (rankings.length === 0) {
    return (
      <p className="text-center text-muted py-8">
        Nenhum check-in registrado ainda. Seja o primeiro!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rankings.map((entry, index) => {
        const position = index + 1;
        const isCurrentUser = entry.user_id === currentUserId;

        return (
          <Link key={entry.user_id} href={memberProfilePath(entry.user_id)}>
            <Card
              padding="sm"
              className={cn(
                "flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all",
                isCurrentUser && "ring-2 ring-primary/30 bg-primary/5",
              )}
            >
            <div className="w-8 text-center shrink-0">
              {position <= 3 ? (
                <Medal
                  className={cn(
                    "h-5 w-5 mx-auto",
                    position === 1 && "text-accent",
                    position === 2 && "text-muted",
                    position === 3 && "text-accent/60",
                  )}
                />
              ) : (
                <span className="text-sm font-bold text-muted">{position}º</span>
              )}
            </div>
            <Avatar src={entry.avatar_url} name={entry.name} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {entry.name}
                {isCurrentUser && (
                  <span className="text-xs text-primary ml-1">(você)</span>
                )}
              </p>
              <p className="text-xs text-muted">
                {entry.total_checkins} check-in
                {entry.total_checkins !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary">{entry.total_points}</p>
              <p className="text-[10px] text-muted">pontos</p>
            </div>
          </Card>
          </Link>
        );
      })}
    </div>
  );
}
