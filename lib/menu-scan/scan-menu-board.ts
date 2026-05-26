import { parseMenuBoardText } from "@/lib/menu-scan/parse-menu-text";
import type { MenuScanResult } from "@/lib/menu-scan/types";
import { extractTextWithGoogleVision } from "@/lib/id-scan/providers/google-vision";
import { extractTextWithTesseract } from "@/lib/id-scan/providers/tesseract";
import {
  idScanProviderLabel,
  resolveIdScanProvider,
  type IdScanProvider,
} from "@/lib/id-scan/scan-id-image";

export { resolveIdScanProvider as resolveMenuScanProvider, idScanProviderLabel as menuScanProviderLabel };
export type { IdScanProvider as MenuScanProvider };

export async function scanMenuBoardBuffer(buffer: Buffer): Promise<MenuScanResult> {
  const provider = resolveIdScanProvider();
  const base64 = buffer.toString("base64");

  let rawText: string;
  if (provider === "google") {
    try {
      rawText = await extractTextWithGoogleVision(base64);
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const billingBlocked = message.includes("BILLING_REQUIRED") || /billing/i.test(message);
      const allowFallback =
        billingBlocked || process.env.ID_SCAN_FALLBACK_TESSERACT === "true";

      if (allowFallback) {
        if (billingBlocked && process.env.NODE_ENV !== "production") {
          console.warn(
            "[campus-bite:menu-scan] Google Vision unavailable (billing). Using Tesseract fallback."
          );
        }
        rawText = await extractTextWithTesseract(buffer);
        const drafts = parseMenuBoardText(rawText);
        return { drafts, rawText, provider: "tesseract" };
      }
      throw err;
    }
  } else {
    rawText = await extractTextWithTesseract(buffer);
  }

  const drafts = parseMenuBoardText(rawText);
  return { drafts, rawText, provider };
}
