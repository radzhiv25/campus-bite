import { notFound, redirect } from "next/navigation";

import { OrderDetailClient } from "@/components/orders/order-detail-client";
import { Navbar, Footer } from "@/components/layout";
import { orderDetailPath, ROUTES } from "@/constants/site";
import { getOrderById } from "@/lib/orders/queries";
import { readCampusSession } from "@/lib/session";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await readCampusSession();
  if (!session.authed) {
    const { id: orderId } = await params;
    redirect(`${ROUTES.login}?from=${encodeURIComponent(orderDetailPath(orderId))}`);
  }

  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <Navbar
        authed={session.authed}
        displayName={session.displayName}
        isAdmin={session.isAdmin}
      />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full min-w-0 max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Order tracking</h1>
          <p className="mt-1 text-muted-foreground">Status updates live when the canteen changes your order.</p>
          <div className="mt-8">
            <OrderDetailClient initialOrder={order} />
          </div>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
