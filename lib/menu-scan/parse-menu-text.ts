import type { MenuDraft, MenuDraftConfidence } from "@/lib/menu-scan/types";

/** Optional currency marker (INR-first; USD kept for occasional OCR noise). */
const CURRENCY_MARK = String.raw`(?:₹|Rs\.?|INR\s*|\$|USD\s*)`;

const PRICE_HEAD = new RegExp(
  `^${CURRENCY_MARK}?([0-9]{1,5}(?:\\.[0-9]{2})?)(?:\\s*(?:INR|USD|₹|Rs\\.?|\\$))?\\s+(.+)$`,
  "i"
);

const PRICE_INLINE = new RegExp(`${CURRENCY_MARK}([0-9]{1,5}(?:\\.[0-9]{2})?)`, "i");

const SKIP_LINE =
  /^(?:menu|today|specials?|appetizers?|mains?|entrees?|desserts?|drinks?|beverages?|sides?|combos?|hours?|open|closed|tax|tip|total|subtotal|order|welcome|thank|please|note|allergen|contains|served|fresh|daily|price|item|qty|quantity|#|©|®)$/i;

const SKIP_LINE_PARTIAL =
  /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|am|pm|copyright|instagram|facebook|www\.|http)/i;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, " ").replace(/^[\s|.;:\\>-]+|[\s|.;:\\>-]+$/g, "").trim();
}

function normalizePrice(raw: string): string | undefined {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 99999) return undefined;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function priceConfidence(price: string | undefined, name: string): MenuDraftConfidence {
  if (!price || !name) return "low";
  if (name.length >= 2 && Number.parseFloat(price) > 0) return "high";
  return "medium";
}

function extractFromLine(line: string): { name: string; price: string } | null {
  const cleaned = cleanLine(line);
  if (cleaned.length < 3) return null;

  const tail = cleaned.match(
    new RegExp(
      `(.+?)\\s*(?:\\.{2,}|…+|\\s[-–—]{1,3}\\s)\\s*${CURRENCY_MARK}?([0-9]{1,5}(?:\\.[0-9]{2})?)\\s*$`,
      "i"
    )
  );
  if (tail?.[1] && tail[2]) {
    const price = normalizePrice(tail[2]);
    const name = cleanLine(tail[1]);
    if (price && name.length >= 2) return { name, price };
  }

  const tailSimple = cleaned.match(
    new RegExp(`^(.+?)\\s+${CURRENCY_MARK}?([0-9]{1,5}(?:\\.[0-9]{2})?)\\s*$`, "i")
  );
  if (tailSimple?.[1] && tailSimple[2]) {
    const price = normalizePrice(tailSimple[2]);
    const name = cleanLine(tailSimple[1].replace(/[.\s…]+$/, ""));
    if (price && name.length >= 2 && !/^\d+$/.test(name)) return { name, price };
  }

  const head = cleaned.match(PRICE_HEAD);
  if (head?.[1] && head[2]) {
    const price = normalizePrice(head[1]);
    const name = cleanLine(head[2]);
    if (price && name.length >= 2) return { name, price };
  }

  const inline = cleaned.match(PRICE_INLINE);
  if (inline?.[1]) {
    const price = normalizePrice(inline[1]);
    const name = cleanLine(cleaned.replace(inline[0], "").replace(/\s+/g, " "));
    if (price && name.length >= 2) return { name, price };
  }

  const tailMatch = cleaned.match(/^(.+?)\s+(\d{1,5}\.\d{2})\s*$/);
  if (tailMatch?.[1] && tailMatch[2]) {
    const price = normalizePrice(tailMatch[2]);
    const name = cleanLine(tailMatch[1]);
    if (price && name.length >= 2) return { name, price };
  }

  const tailInteger = cleaned.match(/^(.+?)\s+(\d{2,5})\s*$/);
  if (tailInteger?.[1] && tailInteger[2]) {
    const price = normalizePrice(tailInteger[2]);
    const name = cleanLine(tailInteger[1]);
    if (price && name.length >= 2 && !/^\d+$/.test(name)) return { name, price };
  }

  return null;
}

function shouldSkipLine(line: string): boolean {
  const cleaned = cleanLine(line);
  if (cleaned.length < 3) return true;
  if (SKIP_LINE.test(cleaned)) return true;
  if (SKIP_LINE_PARTIAL.test(cleaned)) return true;
  if (/^\d{1,2}[:/]\d{1,2}/.test(cleaned)) return true;
  if (/^[\d\s$.,₹]+$/i.test(cleaned)) return true;
  if (!/[A-Za-z]/.test(cleaned)) return true;
  if (cleaned.length <= 4 && cleaned === cleaned.toUpperCase()) return true;
  return false;
}

/** Heuristic parser for menu board OCR text — always review before publishing. */
export function parseMenuBoardText(rawText: string): MenuDraft[] {
  const lines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length > 0 && !shouldSkipLine(line));

  const drafts: MenuDraft[] = [];
  const seen = new Set<string>();

  for (const line of lines) {
    const extracted = extractFromLine(line);
    if (!extracted) continue;

    const key = `${extracted.name.toLowerCase()}|${extracted.price}`;
    if (seen.has(key)) continue;
    seen.add(key);

    drafts.push({
      name: extracted.name,
      price: extracted.price,
      confidence: priceConfidence(extracted.price, extracted.name),
    });
  }

  return drafts;
}
