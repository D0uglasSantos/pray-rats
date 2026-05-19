import { redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getActiveGroupId } from "@/lib/active-group";
import { getUserGroups } from "@/actions/groups";
import { getRanking } from "@/actions/profile";
import { RankingTabs } from "@/components/ranking/ranking-tabs";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const activeGroupId = (await getActiveGroupId()) ?? groups[0]?.id;
  if (!activeGroupId) redirect("/onboarding");

  const params = await searchParams;
  const period = (params.period as "weekly" | "monthly" | "general") ?? "weekly";
  const rankings = await getRanking(activeGroupId, period);

  return (
    <RankingTabs
      rankings={rankings}
      currentUserId={user.id}
      activePeriod={period}
    />
  );
}
