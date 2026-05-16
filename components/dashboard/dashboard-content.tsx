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
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={ROUTES.menu}>View menu</Link>
          </Button>
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
        Food listings from the canteen appear on the{" "}
        <Link href={ROUTES.menu} className="font-medium text-primary underline-offset-4 hover:underline">
          menu
        </Link>
        .{" "}
        {authed
          ? "If your account is an admin in Supabase, this page shows menu management (Add dish, list, remove) below instead of this welcome box."
          : "Admins manage dishes from this dashboard after signing in with a staff account."}
      </p>

      <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-100 p-6 dark:border-border dark:bg-muted/30">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-foreground">Welcome</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-muted-foreground">
          {authed
            ? "Browse the menu to see what is available today."
            : "Sign in to access your account and order from the canteen."}
        </p>
        {authed ? (
          <div className="mt-5 rounded-lg border border-amber-500/30 bg-amber-50/80 p-4 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium text-amber-950 dark:text-amber-50">Looking for “Add dish”?</p>
            <p className="mt-2 text-amber-900/90 dark:text-amber-100/90">
              Staff menu tools (including the button that opens the food dialog) only show when your account is an{" "}
              <strong>admin</strong> in Supabase: set{" "}
              <code className="rounded bg-amber-100/90 px-1 text-xs dark:bg-amber-900/60">app_metadata</code> to{" "}
              <code className="rounded bg-amber-100/90 px-1 text-xs dark:bg-amber-900/60">{`{"role":"admin"}`}</code>{" "}
              for your user, then <strong>sign out and sign in again</strong> so your session picks up the new role.
            </p>
          </div>
        ) : null}
        <Button className="mt-4" asChild>
          <Link href={authed ? ROUTES.menu : `${ROUTES.login}?from=${encodeURIComponent(ROUTES.dashboard)}`}>
            {authed ? "Open menu" : "Sign in"}
          </Link>
        </Button>
      </section>
    </div>
  );
}
