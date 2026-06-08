import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getSessionUser } from "@/actions/auth";
import { getFollowers } from "@/actions/follows";
import { PageHeader } from "@/components/layout/page-header";
import { UserList } from "@/components/social/user-list";

export default async function FollowersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const followers = await getFollowers(user.id);

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
        title="Seguidores"
        subtitle={`${followers.length} pessoa${followers.length !== 1 ? "s" : ""} te segue${followers.length !== 1 ? "m" : ""}`}
      />

      <UserList
        users={followers}
        currentUserId={user.id}
        emptyMessage="Ninguém te segue ainda."
        showFollowActions
      />
    </div>
  );
}
