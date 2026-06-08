import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getFriends } from "@/actions/follows";
import { PageHeader } from "@/components/layout/page-header";
import { UserList } from "@/components/social/user-list";

export default async function FriendsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const friends = await getFriends(user.id);

  return (
    <div className="space-y-6">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar ao perfil
      </Link>

      <PageHeader
        title="Amigos"
        subtitle={`${friends.length} amizade${friends.length !== 1 ? "s" : ""} (seguem um ao outro)`}
      />

      <UserList
        users={friends}
        currentUserId={user.id}
        emptyMessage="Amizades aparecem quando vocês se seguem mutuamente."
      />
    </div>
  );
}
