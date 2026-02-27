import { cn } from "@/lib/utils";

type DashboardShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn("min-h-[calc(100vh-3.5rem-5rem)] px-4 py-8", className)}>
      <div className="mx-auto w-full max-w-4xl">{children}</div>
    </div>
  );
}
