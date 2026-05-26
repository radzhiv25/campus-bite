import { Check } from "lucide-react";

import {
  ORDER_STATUS_LABELS,
  ORDER_TRACKING_STEPS,
  trackingStepIndex,
  type OrderStatus,
} from "@/lib/orders/status";
import { cn } from "@/lib/utils";

type OrderStatusStepperProps = {
  status: OrderStatus;
  className?: string;
};

export function OrderStatusStepper({ status, className }: OrderStatusStepperProps) {
  const activeIndex = trackingStepIndex(status);

  return (
    <ol className={cn("flex w-full flex-col gap-0 sm:flex-row sm:items-start sm:gap-0", className)}>
      {ORDER_TRACKING_STEPS.map((step, index) => {
        const isComplete = activeIndex > index;
        const isCurrent = activeIndex === index;
        const isUpcoming = activeIndex < index;

        return (
          <li
            key={step}
            className={cn(
              "relative flex flex-1 flex-row items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center",
              index < ORDER_TRACKING_STEPS.length - 1 &&
                "sm:after:absolute sm:after:left-[calc(50%+1.25rem)] sm:after:top-5 sm:after:h-0.5 sm:after:w-[calc(100%-2.5rem)] sm:after:bg-border sm:after:content-['']",
              isComplete && "sm:after:bg-amber-500/70"
            )}
          >
            <div
              className={cn(
                "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors",
                isComplete && "border-amber-500 bg-amber-500 text-amber-950",
                isCurrent && "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
                isUpcoming && "border-border bg-muted text-muted-foreground"
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {isComplete ? <Check className="size-5" aria-hidden /> : <span>{index + 1}</span>}
            </div>
            <div className="min-w-0 pb-6 sm:pb-0">
              <p
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : isUpcoming ? "text-muted-foreground" : "text-foreground"
                )}
              >
                {ORDER_STATUS_LABELS[step]}
              </p>
              {isCurrent ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Current step</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
