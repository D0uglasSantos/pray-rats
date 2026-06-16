import { updateTag } from "next/cache";

/** TTL curto para dados de leitura frequente (ranking, feed, stats). */
export const SERVER_CACHE_TTL_SECONDS = 45;

export function groupDataTag(groupId: string): string {
  return `group-data:${groupId}`;
}

/** Invalida cache server-side de um ou mais grupos após mutações de check-in. */
export function revalidateGroupDataCaches(groupIds: string[]): void {
  const unique = [...new Set(groupIds.filter(Boolean))];
  for (const groupId of unique) {
    updateTag(groupDataTag(groupId));
  }
}
