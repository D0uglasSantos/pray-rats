import { redirect } from "next/navigation";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { getSessionUser } from "@/actions/auth";
import { getUserGroups } from "@/actions/groups";

export default async function CreateGroupPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const groups = await getUserGroups(user.id);
  const backHref = groups.length > 0 ? "/groups" : "/onboarding";

  return <CreateGroupForm backHref={backHref} />;
}
