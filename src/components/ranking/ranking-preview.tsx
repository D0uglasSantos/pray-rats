import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { memberProfilePath } from "@/lib/member-profile-path";
import { cn } from "@/lib/utils/cn";
import type { GroupRanking } from "@/types/database";
import { Trophy } from "lucide-react";

const PREVIEW_LIMIT = 4;

export function RankingPreview({
  rankings,
  currentUserId,
}: {
  rankings: GroupRanking[];
  currentUserId: string;
}) {
  const preview = rankings.slice(0, PREVIEW_LIMIT);

  return (
    <section>
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-accent" />
        Classificações
      </h2>

      {preview.length === 0 ? (
        <Card padding="sm">
          <p className="text-sm text-muted text-center py-4">
            Nenhum check-in registrado ainda. Seja o primeiro!
          </p>
        </Card>
      ) : (
        <div className="space-y-2 mb-3">
          {preview.map((entry, index) => {
            const position = index + 1;
            const isCurrentUser = entry.user_id === currentUserId;

            return (
              <Link key={entry.user_id} href={memberProfilePath(entry.user_id)}>
                <Card
                  padding="sm"
                  className={cn(
                    "flex items-center gap-3 hover:ring-2 hover:ring-primary/20 transition-all",
                    isCurrentUser && "ring-2 ring-primary/20 bg-primary/5",
                  )}
                >
                  <Avatar
                    src={entry.avatar_url}
                    name={entry.name}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entry.name}
                      {isCurrentUser && (
                        <span className="text-xs text-primary font-normal ml-1">
                          (você)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {entry.total_checkins} check-in
                      {entry.total_checkins !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-muted shrink-0">
                    {position}º
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/ranking?period=general">
        <Button variant="secondary" fullWidth>
          Todas as classificações
        </Button>
      </Link>
    </section>
  );
}
