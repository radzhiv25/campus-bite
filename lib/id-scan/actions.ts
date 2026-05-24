"use server";

import { idScanProviderLabel, resolveIdScanProvider, scanIdImageBuffer } from "@/lib/id-scan/scan-id-image";
import { logIdScanError, logIdScanResult } from "@/lib/id-scan/log-scan";
import type { IdScanActionState } from "@/lib/id-scan/types";
import { validateIdScanFile } from "@/lib/id-scan/validate-image";

export async function scanStudentIdAction(formData: FormData): Promise<IdScanActionState> {
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return { ok: false, error: "No image was uploaded." };
  }

  const validationError = validateIdScanFile(file);
  if (validationError) {
    return { ok: false, error: validationError };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await scanIdImageBuffer(buffer);

    logIdScanResult(result, { fileName: file.name, fileSize: file.size });

    if (!result.firstName && !result.lastName && !result.studentId) {
      return {
        ok: false,
        error:
          "Could not read name or student ID from the card. Check the photo and try again, or fill the form manually.",
      };
    }

    return { ok: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not scan the ID image.";
    logIdScanError(message, { fileName: file instanceof File ? file.name : undefined });
    const provider = resolveIdScanProvider();
    const hint =
      provider === "google"
        ? " Check GOOGLE_CLOUD_VISION_API_KEY or set ID_SCAN_PROVIDER=tesseract for local OCR."
        : " For better results, set GOOGLE_CLOUD_VISION_API_KEY (free tier) in .env.local.";
    return { ok: false, error: `${message}${hint}` };
  }
}

/** Exposed for UI hints (no secrets). */
export async function getIdScanInfo(): Promise<{ provider: string; usesGoogle: boolean }> {
  const provider = resolveIdScanProvider();
  return {
    provider: idScanProviderLabel(provider),
    usesGoogle: provider === "google",
  };
}

export type { IdScanResult } from "@/lib/id-scan/types";
