"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { CaretDownIcon, ForkKnifeIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SITE, ROUTES } from "@/constants/site";
import { signOut } from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

type NavbarProps = {
  className?: string;
  /**
   * When true, the bar is fixed with no in-flow spacer (sits over full-bleed hero).
   * When false, a spacer keeps page content below the floating bar.
   */
  overlay?: boolean;
  authed?: boolean;
  /** Shown when signed in (from Supabase `user_metadata`, not email). */
  displayName?: string | null;
};

function isMenuRoute(pathname: string | null) {
  if (!pathname) return false;
  return pathname === ROUTES.menu || pathname.startsWith(`${ROUTES.menu}/`);
}

export function Navbar({
  className,
  overlay = false,
  authed = false,
  displayName,
}: NavbarProps) {
  const pathname = usePathname();
  const onMenu = isMenuRoute(pathname);
  const fromParam = encodeURIComponent(pathname || ROUTES.menu);

  const guestAuth = (
    <>
      {!onMenu ? (
        <Button variant="outline" size="default" asChild className="gap-1.5">
          <Link href={ROUTES.menu}>
            Menu
            <UtensilsCrossed className="size-3.5" aria-hidden />
          </Link>
        </Button>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="default"
            size="default"
            className="gap-1 data-[state=open]:bg-primary/80"
            aria-haspopup="menu"
          >
            Account
            <CaretDownIcon className="size-3.5 opacity-90" weight="bold" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem asChild>
            <Link href={`${ROUTES.login}?from=${fromParam}`}>Sign in</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`${ROUTES.signup}?from=${fromParam}`}>Create account</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const bar = (
    <motion.header
      className={cn(
        "w-full rounded-2xl border border-border/60 bg-background/85 shadow-lg shadow-black/5 backdrop-blur-xl dark:bg-background/80 dark:shadow-black/30",
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-foreground/90"
        >
          <ForkKnifeIcon
            className="size-6 shrink-0 text-amber-600 dark:text-amber-400"
            weight="duotone"
          />
          {SITE.name}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle />
          {!authed ? guestAuth : null}
          {authed ? (
            <div className="flex items-center gap-2">
              {displayName ? (
                <span className="hidden max-w-[180px] truncate text-sm font-medium text-foreground sm:inline">
                  {displayName}
                </span>
              ) : null}
              <form action={signOut}>
                <Button type="submit" variant="outline" size="default">
                  Log out
                </Button>
              </form>
            </div>
          ) : null}
        </nav>
      </div>
    </motion.header>
  );

  return (
    <>
      {!overlay ? (
        <div
          className="pointer-events-none shrink-0 w-full"
          style={{ height: "calc(0.75rem + 3.5rem + 0.25rem)" }}
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4 sm:px-4"
        )}
      >
        <div className="pointer-events-auto w-full max-w-4xl">{bar}</div>
      </div>
    </>
  );
}
