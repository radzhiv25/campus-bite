import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminOrdersWorkspace } from "@/components/dashboard/admin-orders-workspace";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/site";
import { getAdminAnalytics } from "@/lib/orders/analytics";
import { listAllOrdersForAdmin } from "@/lib/orders/queries";
import { readCampusSession } from "@/lib/session";

export default async function AdminOrdersPage() {
  const session = await readCampusSession();

  if (!session.authed) {
    redirect(`${ROUTES.login}?from=${encodeURIComponent(ROUTES.adminOrders)}`);
  }
  if (!session.isAdmin) {
    redirect(ROUTES.dashboard);
  }

  const [{ orders, error: ordersError }, { data: analytics, error: analyticsError }] =
    await Promise.all([listAllOrdersForAdmin({ activeOnly: false }), getAdminAnalytics()]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-background">
      <Navbar authed={session.authed} displayName={session.displayName} isAdmin />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8 pb-16">
        <div className="mx-auto w-full min-w-0 max-w-full md:max-w-[calc(50vw-2rem)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff orders</h1>
              <p className="mt-1 max-w-xl text-muted-foreground">
                Run the live queue, open any order for payment and line-item details, or switch to
                Analytics for charts and summaries.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={ROUTES.admin}>Menu admin</Link>
            </Button>
          </div>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <AdminOrdersWorkspace
              orders={orders}
              ordersError={ordersError}
              analytics={analytics}
              analyticsError={analyticsError}
            />
          </div>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
