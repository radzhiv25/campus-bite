export type IdScanResult = {
  firstName?: string;
  lastName?: string;
  studentId?: string;
  rawText: string;
  provider: "google" | "tesseract";
  confidence: "low" | "medium" | "high";
};

export type IdScanActionState =
  | { ok: true; data: IdScanResult }
  | { ok: false; error: string };
