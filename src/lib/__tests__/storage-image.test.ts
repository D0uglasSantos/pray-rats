import { describe, expect, it } from "vitest";
import {
  createStorageImageReference,
  isOwnedStorageImageReference,
  parseStorageImageReference,
} from "@/lib/storage-image";

describe("storage image references", () => {
  it("cria e interpreta uma referência privada estável", () => {
    const reference = createStorageImageReference("checkins", "user-1/photo.jpg");
    expect(reference).toBe("storage://checkins/user-1/photo.jpg");
    expect(parseStorageImageReference(reference)).toEqual({
      bucket: "checkins",
      path: "user-1/photo.jpg",
    });
  });

  it("interpreta URLs públicas legadas sem query string", () => {
    expect(
      parseStorageImageReference(
        "https://project.supabase.co/storage/v1/object/public/avatars/user-1/avatar.jpg?t=1",
      ),
    ).toEqual({ bucket: "avatars", path: "user-1/avatar.jpg" });
  });

  it("valida bucket e pasta do proprietário", () => {
    expect(isOwnedStorageImageReference("storage://avatars/user-1/avatar.jpg", "avatars", "user-1")).toBe(true);
    expect(isOwnedStorageImageReference("storage://avatars/user-2/avatar.jpg", "avatars", "user-1")).toBe(false);
    expect(isOwnedStorageImageReference("storage://checkins/user-1/photo.jpg", "avatars", "user-1")).toBe(false);
  });
});
