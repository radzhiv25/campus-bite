import type { MenuDraft } from "@/lib/menu-scan/types";

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

function columnIndex(headers: string[], patterns: RegExp[]): number {
  const lower = headers.map((h) => h.toLowerCase());
  for (let i = 0; i < lower.length; i++) {
    if (patterns.some((p) => p.test(lower[i]))) return i;
  }
  return -1;
}

function normalizePrice(raw: string): string | undefined {
  const cleaned = raw
    .replace(/[$€£₹]/g, "")
    .replace(/^(?:Rs\.?|INR)\s*/i, "")
    .trim();
  const n = Number.parseFloat(cleaned.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 9999) return undefined;
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

/** Parse simple CSV (name, price, optional description) on the client. */
export function parseMenuCsvText(text: string): MenuDraft[] {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const rows = lines.map(parseCsvLine);
  const header = rows[0];
  const looksLikeHeader =
    header.length >= 2 &&
    columnIndex(header, [/name|item|dish|title|menu/]) >= 0 &&
    columnIndex(header, [/price|cost|amount|usd/]) >= 0;

  const dataRows = looksLikeHeader ? rows.slice(1) : rows;
  const nameIdx = looksLikeHeader
    ? columnIndex(header, [/name|item|dish|title|menu/])
    : 0;
  const priceIdx = looksLikeHeader
    ? columnIndex(header, [/price|cost|amount|usd/])
    : 1;
  const descIdx = looksLikeHeader
    ? columnIndex(header, [/desc|description|details|notes/])
    : 2;

  const drafts: MenuDraft[] = [];
  const seen = new Set<string>();

  for (const row of dataRows) {
    const name = (row[nameIdx] ?? row[0] ?? "").trim();
    const priceRaw = (row[priceIdx] ?? row[1] ?? "").trim();
    const price = normalizePrice(priceRaw);
    const description = (descIdx >= 0 ? row[descIdx] : row[2])?.trim();

    if (!name || !price) continue;

    const key = `${name.toLowerCase()}|${price}`;
    if (seen.has(key)) continue;
    seen.add(key);

    drafts.push({
      name,
      price,
      ...(description ? { description } : {}),
      confidence: "high",
    });
  }

  return drafts;
}
