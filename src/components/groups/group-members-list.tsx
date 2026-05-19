import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface GroupMemberItem {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    name: string;
    avatar_url?: string | null;
    email?: string;
  } | null;
  total_points: number;
  total_checkins: number;
}

export function GroupMembersList({
  members,
  currentUserId,
}: {
  members: GroupMemberItem[];
  currentUserId: string;
}) {
  if (members.length === 0) {
    return (
      <p className="text-center text-muted py-8 text-sm">
        Nenhum participante encontrado.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isCurrentUser = member.user_id === currentUserId;
        const name = member.profile?.name ?? "Participante";

        return (
          <Card
            key={member.id}
            padding="sm"
            className={cn(
              "flex items-center gap-3",
              isCurrentUser && "ring-2 ring-primary/20 bg-primary/5",
            )}
          >
            <Avatar
              src={member.profile?.avatar_url}
              name={name}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm truncate">
                  {name}
                  {isCurrentUser && (
                    <span className="text-xs text-primary font-normal ml-1">
                      (você)
                    </span>
                  )}
                </p>
                {member.role === "admin" && (
                  <Badge variant="primary">Admin</Badge>
                )}
              </div>
              <p className="text-xs text-muted">
                Entrou em{" "}
                {format(new Date(member.joined_at), "d MMM yyyy", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-primary text-sm">
                {member.total_points}
              </p>
              <p className="text-[10px] text-muted">
                {member.total_checkins} check-in
                {member.total_checkins !== 1 ? "s" : ""}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
