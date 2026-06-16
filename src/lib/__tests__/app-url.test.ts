import { describe, it, expect, afterEach } from "vitest";
import {
  getAppUrl,
  appInviteUrl,
  getAuthCallbackUrl,
  getSupabaseRedirectUrls,
} from "@/lib/app-url";

describe("getAppUrl", () => {
  const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;
  const originalVercelUrl = process.env.VERCEL_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    process.env.VERCEL_URL = originalVercelUrl;
  });

  it("corrige hhtps para https", () => {
    process.env.NEXT_PUBLIC_APP_URL = "hhtps://pray-rats.vercel.app";
    expect(getAppUrl()).toBe("https://pray-rats.vercel.app");
  });

  it("remove barra final", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://pray-rats.vercel.app/";
    expect(getAppUrl()).toBe("https://pray-rats.vercel.app");
  });

  it("usa VERCEL_URL quando NEXT_PUBLIC_APP_URL não está definido", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    process.env.VERCEL_URL = "pray-rats.vercel.app";
    expect(getAppUrl()).toBe("https://pray-rats.vercel.app");
  });

  it("monta link de convite corretamente", () => {
    process.env.NEXT_PUBLIC_APP_URL = "hhtps://pray-rats.vercel.app";
    expect(appInviteUrl("2SP95FCN")).toBe(
      "https://pray-rats.vercel.app/invite/2SP95FCN",
    );
  });

  it("monta callback de auth com next encodado", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://pray-rats.vercel.app";
    expect(getAuthCallbackUrl("/reset-password")).toBe(
      "https://pray-rats.vercel.app/auth/callback?next=%2Freset-password",
    );
  });

  it("lista redirect URLs para o Supabase", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://pray-rats.vercel.app";
    expect(getSupabaseRedirectUrls()).toEqual([
      "https://pray-rats.vercel.app/auth/callback",
      "https://pray-rats.vercel.app/reset-password",
    ]);
  });
});
