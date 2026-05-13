import { SITE } from "@/constants/site";

export function formatMenuPrice(priceCents: number): string {
  return new Intl.NumberFormat(SITE.menu.locale, {
    style: "currency",
    currency: SITE.menu.currency,
  }).format(priceCents / 100);
}
