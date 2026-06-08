import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getFollowing } from "@/actions/follows";
import { PageHeader } from "@/components/layout/page-header";
import { UserList } from "@/components/social/user-list";

export default async function FollowingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const following = await getFollowing(user.id);

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
        title="Seguindo"
        subtitle={`Você segue ${following.length} pessoa${following.length !== 1 ? "s" : ""}`}
      />

      <UserList
        users={following}
        currentUserId={user.id}
        emptyMessage="Você ainda não segue ninguém."
        showFollowActions
      />
    </div>
  );
}
