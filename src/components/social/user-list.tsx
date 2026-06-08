import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/components/social/follow-button";
import { getFollowStatus, type FollowUser } from "@/actions/follows";
import { memberProfilePath } from "@/lib/member-profile-path";

interface UserListProps {
  users: FollowUser[];
  currentUserId: string;
  emptyMessage: string;
  showFollowActions?: boolean;
}

export async function UserList({
  users,
  currentUserId,
  emptyMessage,
  showFollowActions = false,
}: UserListProps) {
  if (users.length === 0) {
    return <p className="text-sm text-muted text-center py-8">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      {await Promise.all(
        users.map(async (person) => {
          const status =
            showFollowActions && person.id !== currentUserId
              ? await getFollowStatus(person.id)
              : null;

          return (
            <Card key={person.id} padding="sm" className="flex items-center gap-3">
              <Link href={memberProfilePath(person.id)} className="shrink-0">
                <Avatar src={person.avatar_url} name={person.name} size="md" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={memberProfilePath(person.id)}>
                  <p className="font-semibold text-sm truncate hover:text-primary transition-colors">
                    {person.name}
                  </p>
                </Link>
                {person.bio && (
                  <p className="text-xs text-muted truncate">{person.bio}</p>
                )}
              </div>
              {status && <FollowButton targetUserId={person.id} initialStatus={status} />}
            </Card>
          );
        }),
      )}
    </div>
  );
}
