import { JoinGroupForm } from "@/components/groups/join-group-form";

export default async function JoinGroupPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  return <JoinGroupForm initialCode={params.code} />;
}
