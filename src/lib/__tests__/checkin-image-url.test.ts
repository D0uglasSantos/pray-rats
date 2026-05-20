import { describe, expect, it } from "vitest";
import { getCheckinImageDisplayUrl } from "@/lib/checkin-image-url";

describe("getCheckinImageDisplayUrl", () => {
  it("mantém URLs JPEG inalteradas", () => {
    const url =
      "https://proj.supabase.co/storage/v1/object/public/checkins/user/123.jpg";
    expect(getCheckinImageDisplayUrl(url)).toBe(url);
  });

  it("converte HEIC para endpoint de renderização do Supabase", () => {
    const url =
      "https://proj.supabase.co/storage/v1/object/public/checkins/user/123.heic";
    expect(getCheckinImageDisplayUrl(url)).toBe(
      "https://proj.supabase.co/storage/v1/render/image/public/checkins/user/123.heic?format=origin",
    );
  });
});
