import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Navbar, Footer } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { orderDetailPath, ROUTES, SITE } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import { listOrdersForUser } from "@/lib/orders/queries";
import { readCampusSession } from "@/lib/session";

function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat(SITE.menu.locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export default async function OrdersPage() {
  const session = await readCampusSession();
  if (!session.authed) {
    redirect(`${ROUTES.login}?from=${encodeURIComponent(ROUTES.orders)}`);
  }

  const orders = await listOrdersForUser();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <Navbar
        authed={session.authed}
        displayName={session.displayName}
        isAdmin={session.isAdmin}
      />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full min-w-0 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your orders</h1>
          <p className="mt-1 text-muted-foreground">Track pickup status and view past orders.</p>

          <div className="mt-8 space-y-4">
            {orders.length === 0 ? (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClipboardList aria-hidden />
                  </EmptyMedia>
                  <EmptyTitle>No orders yet</EmptyTitle>
                  <EmptyDescription>
                    When you place an order from checkout, it will show up here with live status updates.
                  </EmptyDescription>
                </EmptyHeader>
                <Button asChild>
                  <Link href={ROUTES.menu}>Browse menu</Link>
                </Button>
              </Empty>
            ) : (
              orders.map((order) => {
                const itemCount = order.items.reduce((sum, line) => sum + line.quantity, 0);
                const preview = order.items
                  .slice(0, 2)
                  .map((line) => line.name)
                  .join(", ");
                const more = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

                return (
                  <Card
                    key={order.id}
                    className="transition-colors hover:border-amber-300/80 dark:hover:border-amber-800/60"
                  >
                    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          <Link
                            href={orderDetailPath(order.id)}
                            className="hover:text-primary hover:underline"
                          >
                            Order #{order.id.slice(0, 8)}
                          </Link>
                        </CardTitle>
                        <CardDescription>{formatOrderDate(order.createdAt)}</CardDescription>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-end justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        <p>
                          {itemCount} {itemCount === 1 ? "item" : "items"} · {preview}
                          {more}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-bold tabular-nums">{formatMenuPrice(order.totalCents)}</p>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={orderDetailPath(order.id)}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
