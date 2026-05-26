import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/status";
import { cn } from "@/lib/utils";

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100",
  confirmed: "bg-sky-100 text-sky-950 dark:bg-sky-950/50 dark:text-sky-100",
  preparing: "bg-violet-100 text-violet-950 dark:bg-violet-950/50 dark:text-violet-100",
  ready: "bg-emerald-100 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-100",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

type OrderStatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn(STATUS_BADGE_CLASS[status], className)}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
