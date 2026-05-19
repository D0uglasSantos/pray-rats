import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser, signOut } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";
import { getUserStats } from "@/actions/checkins";
import { getProfile } from "@/actions/profile";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  const groups = await getUserGroups(user.id);
  const stats = await getUserStats(user.id);

  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" />

      <div className="flex flex-col items-center text-center">
        <Avatar
          src={profile?.avatar_url}
          name={profile?.name ?? "Usuário"}
          size="lg"
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

      <ProfileForm profile={profile} />

      <Card padding="sm">
        <p className="text-sm font-medium mb-2 flex items-center gap-2">
          <Settings className="h-4 w-4" /> Meus grupos
        </p>
        <div className="space-y-2">
          {groups.map((g) => (
            <div
              key={g.id as string}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <span className="text-sm">{g.name as string}</span>
              {(g as { role?: string }).role === "admin" && (
                <Link
                  href={`/groups/${g.id}/admin`}
                  className="text-xs text-primary"
                >
                  Admin
                </Link>
              )}
            </div>
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
