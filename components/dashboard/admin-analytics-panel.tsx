"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SITE } from "@/constants/site";
import { formatMenuPrice } from "@/lib/menu/format-price";
import type { AdminAnalytics } from "@/lib/orders/analytics";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/orders/payment-labels";
import type { PaymentStatus } from "@/lib/orders/status";

type AdminAnalyticsPanelProps = {
  analytics: AdminAnalytics;
};

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const statusChartConfig = {
  count: { label: "Orders", color: "var(--chart-2)" },
} satisfies ChartConfig;

const CHART_COLORS = [
  "hsl(32 95% 44%)",
  "hsl(173 58% 39%)",
  "hsl(221 83% 53%)",
  "hsl(280 65% 60%)",
  "hsl(0 72% 51%)",
  "hsl(142 76% 36%)",
];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(SITE.menu.locale, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function inrTooltip(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "";
  return formatMenuPrice(n);
}

export function AdminAnalyticsPanel({ analytics }: AdminAnalyticsPanelProps) {
  const { summary } = analytics;

  const revenueChartData = analytics.revenueByDay.map((d) => ({
    ...d,
    revenue: d.revenueCents,
  }));

  const statusChartData = analytics.ordersByStatus.map((d) => ({
    name: d.label,
    count: d.count,
  }));

  const paymentChartData = analytics.paymentBreakdown.filter((p) => p.count > 0);

  if (summary.totalOrders === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No orders in {summary.periodLabel.toLowerCase()} yet. Analytics will populate after students
        place orders.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Total orders</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{summary.totalOrders}</p>
          <p className="mt-1 text-xs text-muted-foreground">{summary.periodLabel}</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Revenue (excl. cancelled)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMenuPrice(summary.revenueCents)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Avg {formatMenuPrice(summary.avgOrderCents)} / order
          </p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Paid online (Razorpay)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatMenuPrice(summary.paidOnlineCents)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Confirmed Razorpay payments</p>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Active / completed</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.activeOrders} / {summary.completedOrders}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {summary.cancelledOrders} cancelled
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Revenue by day</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Non-cancelled orders</p>
          <ChartContainer config={revenueChartConfig} className="mt-4 h-56 w-full">
            <BarChart data={revenueChartData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickFormatter={(v) => `₹${Math.round(Number(v) / 100)}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => inrTooltip(value)}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.label ? String(payload[0].payload.label) : ""
                    }
                  />
                }
              />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Orders by status</h3>
          <ChartContainer config={statusChartConfig} className="mt-4 h-56 w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={statusChartData}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
              >
                {statusChartData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Payment methods</h3>
          <ul className="mt-4 space-y-3">
            {paymentChartData.map((row) => (
              <li key={row.method} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">
                  {row.count} orders · {formatMenuPrice(row.revenueCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-border p-4">
          <h3 className="text-sm font-semibold text-foreground">Top items</h3>
          <div className="mt-4 max-h-56 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.topItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground">
                      No item data yet
                    </TableCell>
                  </TableRow>
                ) : (
                  analytics.topItems.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.quantity}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMenuPrice(row.revenueCents)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">Recent orders</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{summary.periodLabel}</p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.recentOrders.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatWhen(row.createdAt)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={row.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="w-fit text-[0.625rem]">
                        {PAYMENT_METHOD_LABELS[row.paymentMethod]}
                      </Badge>
                      <span className="text-[0.625rem] text-muted-foreground capitalize">
                        {PAYMENT_STATUS_LABELS[row.paymentStatus as PaymentStatus] ??
                          row.paymentStatus}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.itemCount}</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatMenuPrice(row.totalCents)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
