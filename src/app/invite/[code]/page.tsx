import { redirect } from "next/navigation";
import { JoinGroupForm } from "@/components/groups/join-group-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <JoinGroupForm initialCode={code.toUpperCase()} />;
}
