import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CheckinImageButton } from "@/components/checkins/checkin-image-button";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";
import { memberProfilePath } from "@/lib/member-profile-path";

interface CheckinCardProps {
  checkin: {
    id: string;
    user_id?: string;
    title: string;
    description?: string | null;
    points: number;
    checked_in_at: string;
    image_url?: string | null;
    profile?: { name: string; avatar_url?: string | null } | null;
    activity_type?: { name: string } | null;
  };
  hideProfileLink?: boolean;
}

export function CheckinCard({ checkin, hideProfileLink }: CheckinCardProps) {
  const profile = checkin.profile;
  const activityName = checkin.activity_type?.name ?? "Atividade";
  const profileHref =
    !hideProfileLink && checkin.user_id
      ? memberProfilePath(checkin.user_id)
      : null;

  const profileContent = (
    <>
      <Avatar
        src={profile?.avatar_url}
        name={profile?.name ?? "Usuário"}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate">
          {profile?.name ?? "Usuário"}
        </p>
        <p className="text-xs text-muted">
          {formatDistanceToNow(new Date(checkin.checked_in_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </p>
      </div>
    </>
  );

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        {profileHref ? (
          <Link href={profileHref} className="flex items-center gap-3 flex-1 min-w-0">
            {profileContent}
          </Link>
        ) : (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {profileContent}
          </div>
        )}
        <Badge variant="accent">+{checkin.points} pts</Badge>
      </div>

      <div>
        <Badge variant="primary" className="mb-2">
          {activityName}
        </Badge>
        <h3 className="font-semibold text-foreground">{checkin.title}</h3>
        {checkin.description && (
          <p className="text-sm text-muted mt-1 line-clamp-3">
            {checkin.description}
          </p>
        )}
      </div>

      {checkin.image_url && (
        <CheckinImageButton
          src={getCheckinImageDisplayUrl(checkin.image_url)}
          alt={`Foto de ${checkin.title}`}
        />
      )}
    </Card>
  );
}
