import type { IdScanResult } from "@/lib/id-scan/types";

const LOG_PREFIX = "[campus-bite:id-scan]";

export function logIdScanResult(result: IdScanResult, meta?: { fileName?: string; fileSize?: number }) {
  if (process.env.NODE_ENV === "production") return;

  const lines = result.rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

  console.groupCollapsed(`${LOG_PREFIX} OCR result (${result.provider}, ${result.confidence} confidence)`);
  if (meta?.fileName) console.log("file:", meta.fileName, meta.fileSize ? `(${meta.fileSize} bytes)` : "");
  console.log("provider:", result.provider);
  console.log("confidence:", result.confidence);
  console.log("parsed:", {
    firstName: result.firstName ?? null,
    lastName: result.lastName ?? null,
    studentId: result.studentId ?? null,
  });
  console.log("rawText:", result.rawText);
  console.log("lines:", lines);
  console.groupEnd();
}

export function logIdScanError(error: string, meta?: { fileName?: string }) {
  if (process.env.NODE_ENV === "production") return;
  console.error(`${LOG_PREFIX} scan failed`, meta?.fileName ? { file: meta.fileName, error } : error);
}
