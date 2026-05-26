import { ROUTES } from "@/constants/site";

/** Staff tools: menu CRUD and order queue (not student ordering). */
export function isAdminRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === ROUTES.admin || pathname.startsWith(`${ROUTES.admin}/`);
}
