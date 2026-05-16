import { createClient } from "@/lib/supabase/client";

import {
  isAllowedMenuImageType,
  MENU_IMAGES_BUCKET,
  MENU_IMAGE_MAX_BYTES,
} from "@/lib/menu/menu-image-storage";

export type UploadMenuImageResult = { url: string } | { error: string };

/**
 * Uploads an image to Supabase Storage (browser client, user session).
 * Requires a public bucket named `menu-images` and policies that allow admin uploads.
 */
export async function uploadMenuItemImage(file: File): Promise<UploadMenuImageResult> {
  if (!isAllowedMenuImageType(file.type)) {
    return { error: "Use a JPEG, PNG, WebP, or GIF image." };
  }
  if (file.size > MENU_IMAGE_MAX_BYTES) {
    return { error: "Image must be 5 MB or smaller." };
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    return { error: "Supabase is not configured in this environment." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";
  const path = `items/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(MENU_IMAGES_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    const msg = uploadError.message.toLowerCase();
    if (msg.includes("bucket") || uploadError.message.includes("not found")) {
      return {
        error: `Storage bucket "${MENU_IMAGES_BUCKET}" is missing. Create it in Supabase (public) and add upload policies for admins.`,
      };
    }
    if (uploadError.message.includes("new row violates") || msg.includes("policy")) {
      return {
        error: "Upload was blocked. Add a Storage policy so admins can insert into this bucket.",
      };
    }
    return { error: uploadError.message };
  }

  const { data } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(path);
  const url = data.publicUrl;
  if (!url?.startsWith("http")) {
    return { error: "Could not build a public URL for the image. Is the bucket public?" };
  }
  return { url };
}
