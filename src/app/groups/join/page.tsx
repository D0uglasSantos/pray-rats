import { redirect } from "next/navigation";
import { JoinGroupForm } from "@/components/groups/join-group-form";
import { getSessionUser } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";

export default async function JoinGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const params = await searchParams;
  const backHref = groups.length > 0 ? "/groups" : "/onboarding";

  return <JoinGroupForm initialCode={params.code} backHref={backHref} />;
}
