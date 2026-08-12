import { describe, it, expect, afterEach } from "vitest";
import { getSupabaseUrl } from "@/lib/supabase/url";

describe("getSupabaseUrl", () => {
  const original = process.env.NEXT_PUBLIC_SUPABASE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = original;
  });

  it("remove /rest/v1 e barra final", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL =
      "https://abc.supabase.co/rest/v1/";
    expect(getSupabaseUrl()).toBe("https://abc.supabase.co");
  });

  it("mantém Project URL válida", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    expect(getSupabaseUrl()).toBe("https://abc.supabase.co");
  });
});
