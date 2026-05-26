"use server";

import {
  menuScanProviderLabel,
  resolveMenuScanProvider,
  scanMenuBoardBuffer,
} from "@/lib/menu-scan/scan-menu-board";
import type { MenuScanActionState } from "@/lib/menu-scan/types";
import { validateIdScanFile } from "@/lib/id-scan/validate-image";

export async function scanMenuBoardAction(formData: FormData): Promise<MenuScanActionState> {
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
    const result = await scanMenuBoardBuffer(buffer);

    if (process.env.NODE_ENV !== "production") {
      console.groupCollapsed(
        `[campus-bite:menu-scan] OCR result (${result.provider}, ${result.drafts.length} drafts)`
      );
      console.log("provider:", result.provider);
      console.log("drafts:", result.drafts);
      console.log("rawText:", result.rawText);
      console.groupEnd();
    }

    if (result.drafts.length === 0) {
      return {
        ok: false,
        error:
          "Could not find any dish names with prices on the menu board. Try a clearer photo or import from CSV.",
      };
    }

    return { ok: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not scan the menu board image.";
    const provider = resolveMenuScanProvider();
    const hint =
      provider === "google"
        ? " Check GOOGLE_CLOUD_VISION_API_KEY or set ID_SCAN_PROVIDER=tesseract for local OCR."
        : " For better results, set GOOGLE_CLOUD_VISION_API_KEY (free tier) in .env.local.";
    return { ok: false, error: `${message}${hint}` };
  }
}

/** Exposed for UI hints (no secrets). */
export async function getMenuScanInfo(): Promise<{ provider: string; usesGoogle: boolean }> {
  const provider = resolveMenuScanProvider();
  return {
    provider: menuScanProviderLabel(provider),
    usesGoogle: provider === "google",
  };
}

export type { MenuDraft, MenuScanResult } from "@/lib/menu-scan/types";
