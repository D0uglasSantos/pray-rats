import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  isAccountDeletionConfirmed,
  permanentlyDeleteAccount,
} from "@/lib/account-deletion";

describe("account deletion", () => {
  it("exige a confirmação explícita sem aceitar texto parcial", () => {
    expect(isAccountDeletionConfirmed(ACCOUNT_DELETION_CONFIRMATION)).toBe(true);
    expect(isAccountDeletionConfirmed(" excluir ")).toBe(true);
    expect(isAccountDeletionConfirmed("exclui")).toBe(false);
    expect(isAccountDeletionConfirmed(null)).toBe(false);
  });

  it("remove os arquivos antes de preparar grupos e excluir o usuário", async () => {
    const calls: string[] = [];
    const admin = {
      storage: {
        from: (bucket: string) => ({
          list: async () => {
            calls.push(`list:${bucket}`);
            return { data: [{ name: "image.jpg" }], error: null };
          },
          remove: async (paths: string[]) => {
            calls.push(`remove:${bucket}:${paths[0]}`);
            return { error: null };
          },
        }),
      },
      rpc: async () => {
        calls.push("prepare");
        return { data: { transferred_groups: 1 }, error: null };
      },
      auth: {
        admin: {
          deleteUser: async () => {
            calls.push("delete-user");
            return { error: null };
          },
        },
      },
    } as unknown as SupabaseClient;

    await permanentlyDeleteAccount(admin, "user-1");

    expect(calls).toEqual([
      "list:avatars",
      "remove:avatars:user-1/image.jpg",
      "list:checkins",
      "remove:checkins:user-1/image.jpg",
      "prepare",
      "delete-user",
    ]);
  });
});
