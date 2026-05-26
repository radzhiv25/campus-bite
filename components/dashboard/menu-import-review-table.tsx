"use client";

import { menuPriceFieldLabel } from "@/constants/site";
import type { MenuDraft } from "@/lib/menu-scan/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type ReviewableMenuDraft = MenuDraft & { id: string; selected: boolean };

type MenuImportReviewTableProps = {
  rows: ReviewableMenuDraft[];
  onRowsChange: (rows: ReviewableMenuDraft[]) => void;
  disabled?: boolean;
};

function confidenceClass(confidence: MenuDraft["confidence"]): string {
  if (confidence === "high") return "text-emerald-700 dark:text-emerald-400";
  if (confidence === "medium") return "text-amber-700 dark:text-amber-400";
  return "text-muted-foreground";
}

export function MenuImportReviewTable({ rows, onRowsChange, disabled }: MenuImportReviewTableProps) {
  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const someSelected = rows.some((r) => r.selected);

  function updateRow(id: string, patch: Partial<ReviewableMenuDraft>) {
    onRowsChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function setAllSelected(selected: boolean) {
    onRowsChange(rows.map((r) => ({ ...r, selected })));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {rows.length} row{rows.length === 1 ? "" : "s"} detected. Edit fields and uncheck rows you do not want to
          import.
        </p>
        <div className="flex items-center gap-2">
          <Checkbox
            id="menu-import-select-all"
            checked={allSelected ? true : someSelected ? "indeterminate" : false}
            onCheckedChange={(v) => setAllSelected(v === true)}
            disabled={disabled || rows.length === 0}
            aria-label="Select all rows"
          />
          <Label htmlFor="menu-import-select-all" className="text-sm font-normal text-muted-foreground">
            Select all
          </Label>
        </div>
      </div>

      <div className="max-h-[min(50vh,360px)] overflow-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead className="w-28">{menuPriceFieldLabel()}</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-20 text-right">OCR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className={cn(!row.selected && "opacity-60")}>
                <TableCell>
                  <Checkbox
                    checked={row.selected}
                    onCheckedChange={(v) => updateRow(row.id, { selected: v === true })}
                    disabled={disabled}
                    aria-label={`Import ${row.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.name}
                    onChange={(ev) => updateRow(row.id, { name: ev.target.value })}
                    disabled={disabled}
                    maxLength={120}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.price}
                    onChange={(ev) => updateRow(row.id, { price: ev.target.value })}
                    disabled={disabled}
                    inputMode="decimal"
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.description ?? ""}
                    onChange={(ev) => updateRow(row.id, { description: ev.target.value })}
                    disabled={disabled}
                    placeholder="Optional"
                    maxLength={2000}
                    className="h-8"
                  />
                </TableCell>
                <TableCell className="text-right text-xs capitalize">
                  <span className={confidenceClass(row.confidence)}>{row.confidence}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
