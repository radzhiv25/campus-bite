/** Public bucket for menu photos; create in Supabase Storage with public read + admin upload policies. */
export const MENU_IMAGES_BUCKET = "menu-images" as const;

export const MENU_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const MENU_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function isAllowedMenuImageType(mime: string): boolean {
  return ALLOWED_TYPES.has(mime);
}
