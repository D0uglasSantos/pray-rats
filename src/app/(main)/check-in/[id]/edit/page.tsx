import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/actions/auth";
import { getCheckinForEdit } from "@/actions/checkins";
import { getUserGroups } from "@/actions/groups";
import { PageHeader } from "@/components/layout/page-header";
import { CheckinEditForm } from "@/components/checkins/checkin-edit-form";
import type { GroupWithRole } from "@/types/database";

export default async function EditCheckinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const context = await getCheckinForEdit(id);
  if (!context) notFound();

  const groups = (await getUserGroups(user.id)) as GroupWithRole[];

  return (
    <div>
      <PageHeader title="Editar check-in" subtitle="Escolha os grupos que deseja alterar" />
      <CheckinEditForm context={context} groups={groups} />
    </div>
  );
}
