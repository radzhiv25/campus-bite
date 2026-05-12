"use client";
import Link from "next/link";
import { SITE, ROUTES } from "@/constants/site";
import { cn } from "@/lib/utils";
import { ForkKnifeIcon } from "@phosphor-icons/react";

type FooterProps = {
  className?: string;
  variant?: "landing" | "dashboard";
};

export function Footer({ className, variant = "landing" }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-border/80 bg-background/50 py-6",
        variant === "dashboard" && "border-border/60",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
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
        <p className="text-xs text-muted-foreground">
          Order from your canteen. Skip the queue.
        </p>
      </div>
    </footer>
  );
}
