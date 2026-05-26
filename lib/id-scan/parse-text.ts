import type { IdScanResult } from "@/lib/id-scan/types";

const STUDENT_ID_LABEL =
  /(?:student\s*id|id\s*no\.?|roll\s*no\.?|enrollment|reg\.?\s*no\.?|usn|srn|id)[:\s#-]*([A-Z0-9][A-Z0-9/-]{2,20})/i;

const STUDENT_ID_PATTERNS = [
  STUDENT_ID_LABEL,
  /\b([A-Z]{2,4}\d{2}[A-Z0-9]{5,12})\b/,
];

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const SKIP_NAME_LINE =
  /university|college|campus|department|valid|expir|registrar|blood|group|b\.?\s*tech|engineering|scheme|school|indore|knowledge|power|medi-?caps|prestige|vijay|near|s\/o|father|mother|phone|mobile|\d{4}-\d{4}|^\d|address|pin/i;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").replace(/^[\s|.;:\\>-]+|[\s|.;:\\>-]+$/g, "").trim();
}

function looksLikeName(line: string): boolean {
  const cleaned = cleanLine(line);
  if (cleaned.length < 3 || cleaned.length > 50) return false;
  if (EMAIL_PATTERN.test(cleaned)) return false;
  if (/^\d+$/.test(cleaned)) return false;
  if (SKIP_NAME_LINE.test(cleaned)) return false;
  if (!/[A-Za-z]/.test(cleaned)) return false;
  // Prefer person names: mostly letters, optional spaces/apostrophes
  const letters = cleaned.replace(/[^A-Za-z\s'.-]/g, "");
  if (letters.length < cleaned.length * 0.85) return false;
  return /^[A-Za-z][A-Za-z\s'.-]+$/.test(letters);
}

function looksLikeAllCapsName(line: string): boolean {
  const cleaned = cleanLine(line);
  if (!looksLikeName(cleaned)) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 2) return false;
  return words.every((w) => /^[A-Z][A-Z'.-]*$/.test(w) && w.length >= 2);
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function titleCase(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function normalizeName(full: string): { firstName: string; lastName: string } {
  const { firstName, lastName } = splitName(full);
  return {
    firstName: titleCase(firstName),
    lastName: lastName.split(/\s+/).map(titleCase).join(" "),
  };
}

function extractLabeledName(lines: string[]): string | undefined {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const inline = line.match(/(?:^|\b)(?:name|student\s*name)[:\s]+(.+)$/i);
    if (inline?.[1] && looksLikeName(inline[1])) return cleanLine(inline[1]);

    if (/^(?:name|student\s*name)\.?$/i.test(line) && lines[i + 1] && looksLikeName(lines[i + 1])) {
      return cleanLine(lines[i + 1]);
    }
  }
  return undefined;
}

function extractStudentId(lines: string[]): string | undefined {
  for (const line of lines) {
    for (const pattern of STUDENT_ID_PATTERNS) {
      const match = line.match(pattern);
      if (match?.[1]) {
        const id = match[1].toUpperCase();
        // Skip pincode-looking numbers embedded in address lines
        if (/(?:m\.?p\.?|indore|pin|address|vijay|scheme)/i.test(line) && /^\d{6}$/.test(id)) {
          continue;
        }
        return id;
      }
    }
  }

  // Labeled ID on its own line (e.g. "452010" under "ID")
  for (let i = 0; i < lines.length; i++) {
    if (/^id\.?$/i.test(lines[i]) || /^student\s*id\.?$/i.test(lines[i])) {
      const next = lines[i + 1]?.match(/^(\d{4,10})$/);
      if (next?.[1]) return next[1];
    }
  }

  return undefined;
}

/** Heuristic parser for campus ID OCR text — always review in the UI. */
export function parseIdCardText(
  rawText: string
): Pick<IdScanResult, "firstName" | "lastName" | "studentId" | "confidence"> {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 0);

  const studentId = extractStudentId(lines);

  const labeledName = extractLabeledName(lines);
  const allCapsCandidates = lines.filter(looksLikeAllCapsName);
  const nameCandidates = lines.filter(looksLikeName);

  const nameLine =
    labeledName ??
    allCapsCandidates.sort((a, b) => b.length - a.length)[0] ??
    nameCandidates.find((line) => line.split(/\s+/).length >= 2) ??
    nameCandidates[0];

  const { firstName, lastName } = nameLine
    ? normalizeName(nameLine)
    : { firstName: "", lastName: "" };

  const filled = [firstName, lastName, studentId].filter(Boolean).length;
  const confidence: IdScanResult["confidence"] =
    filled >= 3 ? "high" : filled === 2 ? "medium" : filled === 1 ? "low" : "low";

  return {
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    studentId,
    confidence,
  };
}
