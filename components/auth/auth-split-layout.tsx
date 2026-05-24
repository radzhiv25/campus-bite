import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

type AuthSplitLayoutProps = {
  children: React.ReactNode;
  brandPosition?: "left" | "right";
  formMaxWidth?: "sm" | "md";
};

export function AuthSplitLayout({
  children,
  brandPosition = "left",
  formMaxWidth = "sm",
}: AuthSplitLayoutProps) {
  const brandFirst = brandPosition === "left";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden lg:fixed lg:inset-0 lg:z-0 lg:grid lg:grid-cols-2 lg:grid-rows-1">
      <div
        className={cn(
          "min-h-0 shrink-0 overflow-hidden max-lg:max-h-[38vh]",
          brandFirst ? "order-1 lg:order-1" : "order-1 lg:order-2",
          "lg:h-full"
        )}
      >
        <AuthBrandPanel />
      </div>

      <div
        className={cn(
          "relative flex h-0 min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain bg-background",
          brandFirst ? "order-2 lg:order-2" : "order-2 lg:order-1",
          "lg:h-full lg:flex-none"
        )}
      >
        <div className="pointer-events-none sticky top-0 z-20 flex shrink-0 justify-end px-6 pt-6 sm:px-10 sm:pt-10 lg:px-16 lg:pt-12">
          <div className="pointer-events-auto">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-2 sm:px-10 lg:px-16">
          <div
            className={cn(
              "my-auto w-full",
              formMaxWidth === "md" ? "max-w-md" : "max-w-sm"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
