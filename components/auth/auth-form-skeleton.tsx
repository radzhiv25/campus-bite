import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors login field stack (email + password + submit). */
export function LoginAuthSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-10" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-7 w-full" />
      </div>
      <Skeleton className="h-7 w-full" />
    </div>
  );
}

/** Mirrors signup: names row, email, passwords, submit. */
export function SignupAuthSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-7 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-7 w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-11" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-7 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-7 w-full" />
      </div>
      <Skeleton className="h-7 w-full" />
    </div>
  );
}
