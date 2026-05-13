"use client";

import { ListBullets, MagnifyingGlass, Rows, SquaresFour } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { MenuItemCard } from "@/components/menu/menu-item-card";
import { MenuItemRow } from "@/components/menu/menu-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/constants/site";
import type { MenuItem } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

/** Default hides unavailable rows; use `full` to show the whole menu, or `unavailable` for out-of-stock only. */
type AvailabilityFilter = "in_stock" | "full" | "unavailable";
type LayoutMode = "grid" | "list";

function filterItems(items: MenuItem[], search: string, availability: AvailabilityFilter): MenuItem[] {
  const q = search.trim().toLowerCase();
  return items.filter((item) => {
    if (availability === "in_stock" && !item.is_available) return false;
    if (availability === "unavailable" && item.is_available) return false;
    if (q) {
      const hay = `${item.name} ${item.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

type MenuBrowserProps = {
  items: MenuItem[];
};

export function MenuBrowser({ items }: MenuBrowserProps) {
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("in_stock");
  const [layout, setLayout] = useState<LayoutMode>("grid");

  const filtered = useMemo(
    () => filterItems(items, search, availability),
    [items, search, availability]
  );

  const hasActiveFilters = Boolean(search.trim()) || availability !== "in_stock";

  const poolCount = useMemo(() => filterItems(items, "", availability).length, [items, availability]);

  if (items.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <p className="text-sm font-medium text-foreground">No dishes on the menu yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            When your data source is connected, items will show here.
          </p>
          <Button variant="outline" size="sm" className="mt-6" asChild>
            <Link href={ROUTES.home}>Back home</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader className="border-b border-border/80 bg-muted/20">
          <CardTitle className="text-base">Browse &amp; filter</CardTitle>
          <CardDescription>
            Search the menu and switch layout. Out-of-stock dishes stay hidden unless you choose &quot;Full menu&quot;
            or &quot;Unavailable only&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="relative">
            <MagnifyingGlass
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or description…"
              className="h-10 pl-9"
              aria-label="Search menu"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                Availability
              </span>
              <Select value={availability} onValueChange={(v) => setAvailability(v as AvailabilityFilter)}>
                <SelectTrigger size="default" className="h-9 min-w-[11rem] w-full sm:w-[11rem]">
                  <SelectValue placeholder="Availability" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In stock (default)</SelectItem>
                  <SelectItem value="full">Full menu</SelectItem>
                  <SelectItem value="unavailable">Unavailable only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5 sm:items-end">
              <span className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">Layout</span>
              <div
                className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5"
                role="group"
                aria-label="Menu layout"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 rounded-md px-2.5",
                    layout === "grid" && "bg-background text-foreground shadow-sm"
                  )}
                  onClick={() => setLayout("grid")}
                  aria-pressed={layout === "grid"}
                >
                  <SquaresFour className="size-4" weight="duotone" aria-hidden />
                  Grid
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5 rounded-md px-2.5",
                    layout === "list" && "bg-background text-foreground shadow-sm"
                  )}
                  onClick={() => setLayout("list")}
                  aria-pressed={layout === "list"}
                >
                  <Rows className="size-4" weight="duotone" aria-hidden />
                  List
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
            <span className="font-medium text-foreground">{poolCount}</span> in this view
            {hasActiveFilters ? " (filters applied)" : null}
          </p>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-dashed bg-muted/15">
          <CardContent className="py-10 text-center">
            <ListBullets className="mx-auto size-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm font-medium text-foreground">No matches</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or reset the filters.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearch("");
                setAvailability("in_stock");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : layout === "grid" ? (
        <Card className="scroll-mt-28 overflow-hidden shadow-md">
          <CardHeader className="border-b border-border/80 bg-muted/15">
            <CardTitle className="text-base">Menu</CardTitle>
            <CardDescription>
              {filtered.length} item{filtered.length === 1 ? "" : "s"} — browse everything in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="grid list-none gap-4 p-0 sm:grid-cols-2">
              {filtered.map((item) => (
                <li key={item.id} className="min-h-0">
                  <MenuItemCard item={item} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="scroll-mt-28 overflow-hidden shadow-md">
          <CardHeader className="border-b border-border/80 bg-muted/15">
            <CardTitle className="text-base">Menu</CardTitle>
            <CardDescription>
              {filtered.length} item{filtered.length === 1 ? "" : "s"} — browse everything in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {filtered.map((item) => (
              <MenuItemRow key={item.id} item={item} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
