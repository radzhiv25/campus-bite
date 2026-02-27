"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { UtensilsCrossed, Settings } from "lucide-react";
import { SITE, NAV_LINKS, ROUTES } from "@/constants/site";
import { cn } from "@/lib/utils";

type NavbarProps = {
  className?: string;
};

export function Navbar({ className }: NavbarProps) {
  return (
    <motion.header
      className={cn(
        "border-b border-amber-200/40 bg-white/50 backdrop-blur-sm",
        className
      )}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <Link
          href={ROUTES.home}
          className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 bg-clip-text text-lg font-semibold text-transparent"
        >
          {SITE.name}
        </Link>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const Icon =
              link.href === ROUTES.admin ? Settings : UtensilsCrossed;
            return (
              <Link key={link.href} href={link.href}>
                <motion.span
                  className="flex items-center gap-1.5 rounded-md border border-amber-500/40 px-2 py-1 text-sm font-medium text-amber-700 hover:text-amber-800"
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  {link.label}
                  <Icon className="h-4 w-4" />
                </motion.span>
              </Link>
            );
          })}
        </nav>
      </div>
    </motion.header>
  );
}
