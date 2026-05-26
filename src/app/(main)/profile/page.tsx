import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getUserStats, getUserRecords } from "@/actions/checkins";
import { getProfile } from "@/actions/profile";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { UserRecordsSection } from "@/components/profile/user-records";
import { GroupListItem } from "@/components/groups/group-list-item";
import { PushNotificationToggle } from "@/components/profile/push-notification-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "@/actions/auth";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  const stats = await getUserStats(user.id);
  const records = await getUserRecords(user.id, activeGroupId);

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
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-primary">{stats.totalCheckins}</p>
          <p className="text-[10px] text-muted">check-ins</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-primary">{stats.totalPoints}</p>
          <p className="text-[10px] text-muted">pontos</p>
        </Card>
        <Card padding="sm" className="text-center">
          <p className="text-xl font-bold text-primary">{groups.length}</p>
          <p className="text-[10px] text-muted">grupos</p>
        </Card>
      </div>

      <UserRecordsSection records={records} />

      <ProfileForm profile={profile} />

      <PushNotificationToggle />

      <Card padding="sm">
        <p className="text-sm font-medium mb-2">Meus grupos</p>
        <div className="space-y-1">
          {groups.map((g) => (
            <GroupListItem
              key={g.id}
              group={g}
              isActive={g.id === activeGroupId}
            />
          ))}
        </div>
      </Card>

      <form action={signOut}>
        <Button variant="secondary" fullWidth type="submit">
          <LogOut className="h-4 w-4" /> Sair da conta
        </Button>
      </form>
    </div>
  );
}
