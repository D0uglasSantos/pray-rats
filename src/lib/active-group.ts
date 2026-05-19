import { cookies } from "next/headers";

const COOKIE_NAME = "active_group_id";

export async function getActiveGroupId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export { COOKIE_NAME };
