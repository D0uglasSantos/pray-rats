import { redirect, notFound } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import {
  getUserGroups,
  getGroupMembers,
  getGroupActivities,
  isUserAdmin,
} from "@/actions/groups";
import { getAppUrl } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/server";
import { AdminPanel } from "@/components/groups/admin-panel";
import type { Group, ActivityType } from "@/types/database";

export default async function GroupAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: groupId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const isAdmin = await isUserAdmin(groupId, user.id);
  if (!isAdmin) redirect("/home");

  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .single();

  if (!group) notFound();

  const members = await getGroupMembers(groupId);
  const activities = (await getGroupActivities(groupId)) as ActivityType[];

  const inviteUrl = `${getAppUrl()}/invite/${group.invite_code}`;

  return (
    <div className="min-h-screen gradient-subtle">
      <main className="mx-auto max-w-lg px-4 pt-6">
        <AdminPanel
          group={group as Group}
          members={members}
          activities={activities}
          inviteUrl={inviteUrl}
        />
      </main>
    </div>
  );
}
