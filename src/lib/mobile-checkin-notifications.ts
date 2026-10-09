import { z } from "zod";

const mobileCheckinNotificationSchema = z.object({
  checkinIds: z.array(z.uuid()).min(1).max(10),
});

export function parseMobileCheckinNotificationBody(value: unknown) {
  const result = mobileCheckinNotificationSchema.safeParse(value);
  if (!result.success) return null;
  return [...new Set(result.data.checkinIds)];
}

export function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return null;
  const token = authorization.slice(7).trim();
  return token || null;
}
