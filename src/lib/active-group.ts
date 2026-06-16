import { cookies } from "next/headers";
import { cache } from "react";

const COOKIE_NAME = "active_group_id";

export const getActiveGroupId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
});

export { COOKIE_NAME };
