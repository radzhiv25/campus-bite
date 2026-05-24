import { parseIdCardText } from "@/lib/id-scan/parse-text";
import { extractTextWithGoogleVision } from "@/lib/id-scan/providers/google-vision";
import { extractTextWithTesseract } from "@/lib/id-scan/providers/tesseract";
import type { IdScanResult } from "@/lib/id-scan/types";

export type IdScanProvider = "google" | "tesseract";

/** Prefer Google Vision when configured; Tesseract is the zero-cost fallback. */
export function resolveIdScanProvider(): IdScanProvider {
  const forced = process.env.ID_SCAN_PROVIDER?.trim().toLowerCase();
  if (forced === "tesseract") return "tesseract";
  if (forced === "google") return "google";
  if (process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim()) return "google";
  return "tesseract";
}

export async function scanIdImageBuffer(buffer: Buffer): Promise<IdScanResult> {
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
            "[campus-bite:id-scan] Google Vision unavailable (billing). Using Tesseract fallback."
          );
        }
        rawText = await extractTextWithTesseract(buffer);
        const parsed = parseIdCardText(rawText);
        return { ...parsed, rawText, provider: "tesseract" };
      }
      throw err;
    }
  } else {
    rawText = await extractTextWithTesseract(buffer);
  }

  const parsed = parseIdCardText(rawText);
  return { ...parsed, rawText, provider };
}

export function idScanProviderLabel(provider: IdScanProvider): string {
  return provider === "google" ? "Google Cloud Vision" : "Tesseract (local OCR)";
}
