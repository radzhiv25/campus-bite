import Link from "next/link";
import { SITE, ROUTES } from "@/constants/site";
import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
  variant?: "landing" | "dashboard";
};

export function Footer({ className, variant = "landing" }: FooterProps) {
  return (
    <footer
      className={cn(
        "border-t border-zinc-200/80 bg-white/50 py-6",
        variant === "dashboard" && "border-amber-200/40",
        className
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <Link
          href={ROUTES.home}
          className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-500 bg-clip-text text-lg font-medium text-transparent hover:opacity-90"
        >
          {SITE.name}
        </Link>
        <p className="text-xs text-zinc-500">
          Order from your canteen. Skip the queue.
        </p>
      </div>
    </footer>
  );
}
