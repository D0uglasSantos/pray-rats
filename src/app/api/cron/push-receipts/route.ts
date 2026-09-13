import { processExpoPushReceipts } from "@/lib/process-expo-push-receipts";
import { logServerError } from "@/lib/monitoring";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return Response.json({ error: "CRON_SECRET não configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    return Response.json(await processExpoPushReceipts());
  } catch (error) {
    logServerError("cron.pushReceipts", error);
    return Response.json({ error: "Não foi possível processar os receipts." }, { status: 500 });
  }
}
