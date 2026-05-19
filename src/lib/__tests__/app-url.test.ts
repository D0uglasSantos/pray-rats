import { describe, it, expect, afterEach } from "vitest";
import { getAppUrl, appInviteUrl } from "@/lib/app-url";

describe("getAppUrl", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("corrige hhtps para https", () => {
    process.env.NEXT_PUBLIC_APP_URL = "hhtps://pray-rats.vercel.app";
    expect(getAppUrl()).toBe("https://pray-rats.vercel.app");
  });

  it("remove barra final", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://pray-rats.vercel.app/";
    expect(getAppUrl()).toBe("https://pray-rats.vercel.app");
  });

  it("monta link de convite corretamente", () => {
    process.env.NEXT_PUBLIC_APP_URL = "hhtps://pray-rats.vercel.app";
    expect(appInviteUrl("2SP95FCN")).toBe(
      "https://pray-rats.vercel.app/invite/2SP95FCN",
    );
  });
});
