/** Google Cloud Vision document OCR (free tier: ~1,000 units/month). */
export async function extractTextWithGoogleVision(base64: string): Promise<string> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_VISION_API_KEY is not configured.");
  }

  const res = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: base64 },
          imageContext: { languageHints: ["en", "hi"] },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 403 && /billing/i.test(body)) {
      throw new Error(
        "BILLING_REQUIRED: Google Cloud Vision needs billing enabled on your project (you still get a free monthly quota). See Google Cloud Console → Billing, or use ID_SCAN_PROVIDER=tesseract in .env.local."
      );
    }
    throw new Error(`Google Vision request failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      textAnnotations?: Array<{ description?: string }>;
      error?: { message?: string };
    }>;
  };

  const first = json.responses?.[0];
  if (first?.error?.message) {
    throw new Error(first.error.message);
  }

  const text =
    first?.fullTextAnnotation?.text?.trim() ??
    first?.textAnnotations?.[0]?.description?.trim() ??
    "";

  if (!text) {
    throw new Error("No text found on the image. Try better lighting and a flat ID.");
  }

  return text;
}
