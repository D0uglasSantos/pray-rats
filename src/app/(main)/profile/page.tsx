import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getUserStats, getUserRecords } from "@/actions/checkins";
import { getProfile } from "@/actions/profile";
import { getFollowCounts } from "@/actions/follows";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { UserRecordsSection } from "@/components/profile/user-records";
import { GroupListItem } from "@/components/groups/group-list-item";
import { PushNotificationToggle } from "@/components/profile/push-notification-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Plus, Users } from "lucide-react";
import { signOut } from "@/actions/auth";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  const stats = await getUserStats(user.id);
  const records = await getUserRecords(user.id, activeGroupId);
  const followCounts = await getFollowCounts(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" />

      <div className="flex flex-col items-center text-center">
        <AvatarUpload
          avatarUrl={profile?.avatar_url ?? null}
          name={profile?.name ?? "Usuário"}
        />
        <h2 className="text-xl font-bold mt-3">{profile?.name}</h2>
        {profile?.bio && (
          <p className="text-sm text-muted mt-1 max-w-xs">{profile.bio}</p>
        )}
        <p className="text-xs text-muted mt-1">{profile?.email}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link href="/profile/followers">
          <Card padding="sm" className="text-center hover:ring-2 hover:ring-primary/20 transition-all">
            <p className="text-xl font-bold text-primary">{followCounts.followers}</p>
            <p className="text-[10px] text-muted">seguidores</p>
          </Card>
        </Link>
        <Link href="/profile/following">
          <Card padding="sm" className="text-center hover:ring-2 hover:ring-primary/20 transition-all">
            <p className="text-xl font-bold text-primary">{followCounts.following}</p>
            <p className="text-[10px] text-muted">seguindo</p>
          </Card>
        </Link>
        <Link href="/profile/friends">
          <Card padding="sm" className="text-center hover:ring-2 hover:ring-primary/20 transition-all">
            <p className="text-xl font-bold text-primary">{followCounts.friends}</p>
            <p className="text-[10px] text-muted">amigos</p>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-primary">{stats.totalCheckins}</p>
          <p className="text-[10px] text-muted">check-ins</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-primary">{stats.totalPoints}</p>
          <p className="text-[10px] text-muted">pontos</p>
        </Card>
        <Link href="/groups">
          <Card padding="sm" className="text-center hover:ring-2 hover:ring-primary/20 transition-all">
            <p className="text-xl font-bold text-primary">{groups.length}</p>
            <p className="text-[10px] text-muted">grupos</p>
          </Card>
        </Link>
      </div>

      <UserRecordsSection records={records} />

      <ProfileForm profile={profile} />

      <PushNotificationToggle />

      <Card padding="sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium">Meus grupos</p>
          <Link href="/groups/join" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
            <Plus className="h-3 w-3" /> Entrar em outro
          </Link>
        </div>
        <div className="space-y-1">
          {groups.map((g) => (
            <GroupListItem
              key={g.id}
              group={g}
              isActive={g.id === activeGroupId}
            />
          ))}
        </div>
        {groups.length > 1 && (
          <Link href="/groups" className="block mt-3">
            <Button variant="ghost" size="sm" fullWidth>
              <Users className="h-4 w-4" /> Ver todos os grupos e feeds
            </Button>
          </Link>
        )}
      </Card>

      <form action={signOut}>
        <Button variant="secondary" fullWidth type="submit">
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </form>
    </div>
  );
}
