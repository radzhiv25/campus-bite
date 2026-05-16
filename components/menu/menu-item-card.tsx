import { formatMenuPrice } from "@/lib/menu/format-price";
import type { MenuItem } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

type MenuItemCardProps = {
  item: MenuItem;
};

export function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        !item.is_available && "opacity-80"
      )}
    >
      <div className="relative aspect-[4/3] w-full bg-muted">
        {item.image_url ? (
          // Arbitrary admin URLs: skip next/image domain allowlist
          // eslint-disable-next-line @next/next/no-img-element -- external menu photos
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
        )}
        {!item.is_available ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium">
            Unavailable
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground">{item.name}</h3>
          <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
            {formatMenuPrice(item.price_cents)}
          </p>
        </div>
        {item.description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
        ) : null}
      </div>
    </article>
  );
}
