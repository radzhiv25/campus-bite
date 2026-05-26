import Link from "next/link";

import { AdminMenuPanel } from "@/components/dashboard/admin-menu-panel";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/site";
import type { MenuItem } from "@/lib/menu/types";

type DashboardContentProps = {
  authed: boolean;
  isAdmin: boolean;
  menuItems: MenuItem[];
};

export function DashboardContent({ authed, isAdmin, menuItems }: DashboardContentProps) {
  if (isAdmin) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-card dark:shadow-md dark:ring-1 dark:ring-border/60">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Dashboard</h1>
            <p className="mt-2 text-zinc-600 dark:text-muted-foreground">
              Manage menu items. Changes are visible on the public menu right away.
            </p>
            <p className="mt-2 text-sm text-amber-800/90 dark:text-amber-200/90">
              Use the <strong>Staff</strong> menu in the navbar for the order queue and menu admin.
            </p>
          </div>
        </div>
        <div className="mt-10">
          <AdminMenuPanel items={menuItems} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-card dark:shadow-md dark:ring-1 dark:ring-border/60">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-foreground">Dashboard</h1>
      <p className="mt-2 text-zinc-600 dark:text-muted-foreground">
        {authed
          ? "Browse today’s menu, place an order, and track pickup status from your orders page."
          : "Sign in to order from the campus canteen and see your order history."}
      </p>

      <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-100 p-6 dark:border-border dark:bg-muted/30">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-foreground">Welcome</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-muted-foreground">
          {authed
            ? "Pick items from the menu, check out, and we’ll update you when your order is ready."
            : "Create an account or sign in to start ordering."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={authed ? ROUTES.menu : `${ROUTES.login}?from=${encodeURIComponent(ROUTES.dashboard)}`}>
              {authed ? "Browse menu" : "Sign in"}
            </Link>
          </Button>
          {authed ? (
            <Button variant="outline" asChild>
              <Link href={ROUTES.orders}>My orders</Link>
            </Button>
          ) : null}
        </div>
      </section>
    </div>
  );
}
