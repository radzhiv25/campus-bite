export const ID_SCAN_MAX_BYTES = 5 * 1024 * 1024;

export const ID_SCAN_ACCEPT = "image/jpeg,image/png,image/webp";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateIdScanFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Use a JPEG, PNG, or WebP photo of your student ID.";
  }
  if (file.size > ID_SCAN_MAX_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  if (file.size < 1024) {
    return "Image file is too small. Try a clearer photo.";
  }
  return null;
}

export async function fileToBase64(file: File | Blob): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return buffer.toString("base64");
}
