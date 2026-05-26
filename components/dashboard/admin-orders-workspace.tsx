"use client";

import { AdminAnalyticsPanel } from "@/components/dashboard/admin-analytics-panel";
import { OrdersPanel } from "@/components/dashboard/orders-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminAnalytics } from "@/lib/orders/analytics";
import type { AdminOrderSummary } from "@/lib/orders/types";

type AdminOrdersWorkspaceProps = {
  orders: AdminOrderSummary[];
  ordersError: string | null;
  analytics: AdminAnalytics | null;
  analyticsError: string | null;
};

export function AdminOrdersWorkspace({
  orders,
  ordersError,
  analytics,
  analyticsError,
}: AdminOrdersWorkspaceProps) {
  return (
    <Tabs defaultValue="queue" className="w-full">
      <TabsList className="w-full max-w-md">
        <TabsTrigger value="queue" className="flex-1">
          Order queue
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex-1">
          Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="queue" className="mt-6">
        {ordersError ? (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {ordersError}
          </p>
        ) : null}
        <OrdersPanel initialOrders={orders} />
      </TabsContent>

      <TabsContent value="analytics" className="mt-6">
        {analyticsError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {analyticsError}
          </p>
        ) : analytics ? (
          <AdminAnalyticsPanel analytics={analytics} />
        ) : (
          <p className="text-sm text-muted-foreground">Analytics could not be loaded.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}
