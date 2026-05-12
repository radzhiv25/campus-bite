"use client";

import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type">
>(function PasswordInput({ className, ...props }, ref) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative w-full">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-9 items-center justify-center">
        <button
          type="button"
          className={cn(
            "pointer-events-auto flex size-7 shrink-0 items-center justify-center rounded-md bg-transparent text-muted-foreground",
            "outline-none hover:bg-transparent hover:text-foreground active:bg-transparent",
            "focus-visible:bg-transparent focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          )}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          <span className="relative block size-4 shrink-0" aria-hidden>
            <EyeIcon
              className={cn(
                "absolute inset-0 size-4 transition-opacity duration-150",
                visible ? "opacity-0" : "opacity-100"
              )}
              weight="bold"
            />
            <EyeSlashIcon
              className={cn(
                "absolute inset-0 size-4 transition-opacity duration-150",
                visible ? "opacity-100" : "opacity-0"
              )}
              weight="bold"
            />
          </span>
        </button>
      </div>
    </div>
  );
});
