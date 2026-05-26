export type MenuDraftConfidence = "low" | "medium" | "high";

export type MenuDraft = {
  name: string;
  description?: string;
  price: string;
  confidence: MenuDraftConfidence;
};

export type MenuScanResult = {
  drafts: MenuDraft[];
  rawText: string;
  provider: "google" | "tesseract";
};

export type MenuScanActionState =
  | { ok: true; data: MenuScanResult }
  | { ok: false; error: string };

export type MenuDraftInput = {
  name: string;
  description?: string;
  price: string;
};
