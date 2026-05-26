/** Local OCR fallback — free, slower, less accurate on ID cards than Google Vision. */
export async function extractTextWithTesseract(buffer: Buffer): Promise<string> {
  const Tesseract = await import("tesseract.js");
  const { data } = await Tesseract.recognize(buffer, "eng", {
    logger: () => {},
  });
  const text = data.text?.trim() ?? "";
  if (!text) {
    throw new Error("No text found on the image. Try a clearer photo or use Google Vision.");
  }
  return text;
}
