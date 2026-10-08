import { isAccountDeletionConfirmed, permanentlyDeleteAccount } from "@/lib/account-deletion";
import { logServerError, logServerEvent } from "@/lib/monitoring";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : null;
}

export async function DELETE(request: Request) {
  const token = bearerToken(request);
  if (!token) return Response.json({ error: "Não autenticado." }, { status: 401 });

  let body: { confirmation?: unknown };
  try {
    body = (await request.json()) as { confirmation?: unknown };
  } catch {
    return Response.json({ error: "Confirmação inválida." }, { status: 400 });
  }
  if (!isAccountDeletionConfirmed(body.confirmation)) {
    return Response.json({ error: "Digite EXCLUIR para confirmar." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    logServerError("account.delete.config", error);
    return Response.json({ error: "Serviço de exclusão indisponível." }, { status: 503 });
  }

  const { data, error: userError } = await admin.auth.getUser(token);
  const user = data.user;
  if (userError || !user) {
    return Response.json({ error: "Sua sessão expirou. Entre novamente." }, { status: 401 });
  }

  try {
    const result = await permanentlyDeleteAccount(admin, user.id);
    logServerEvent("account.delete", "completed", {
      userId: user.id,
      transferredGroups: result?.transferred_groups ?? 0,
      deletedEmptyGroups: result?.deleted_empty_groups ?? 0,
    });
    return Response.json({ success: true });
  } catch (error) {
    logServerError("account.delete", error, { userId: user.id });
    return Response.json(
      { error: "Não foi possível concluir a exclusão. Tente novamente ou contate o suporte." },
      { status: 500 },
    );
  }
}
