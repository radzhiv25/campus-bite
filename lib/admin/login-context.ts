import { ROUTES } from "@/constants/site";

/** True when the login redirect target is the admin area (no self-serve signup for staff). */
export function isAdminLoginFrom(from: string | null | undefined): boolean {
  if (!from || !from.startsWith("/") || from.startsWith("//")) return false;
  return from === ROUTES.admin || from.startsWith(`${ROUTES.admin}/`);
}
