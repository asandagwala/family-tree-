import type { Id } from "@/convex/_generated/dataModel";

// Matches the server-side limit in convex/lib/security.ts.
export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;

/** Uploads an image to Convex storage and returns its storage id. */
export async function uploadImage(file: File, generateUploadUrl: () => Promise<string>): Promise<Id<"_storage">> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("Photos must be smaller than 15 MB.");
  const url = await generateUploadUrl();
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
  if (!res.ok) throw new Error("The upload failed. Please try again.");
  const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
  return storageId;
}
