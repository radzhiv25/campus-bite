import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthBrandPanel } from "@/components/auth/auth-brand-panel";
import { SignupForm } from "@/components/auth/signup-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ROUTES } from "@/constants/site";
import { readCampusSession } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

function SignupFormFallback() {
  return (
    <div className="flex min-h-[200px] w-full max-w-sm items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { authed } = await readCampusSession();
  if (authed) {
    const { from } = await searchParams;
    const safeFrom =
      from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;
    redirect(safeFrom);
  }

  return (
    <div className="grid min-h-dvh w-full lg:grid-cols-2">
      <div className="relative order-2 flex flex-col justify-center bg-background px-6 py-10 sm:px-10 lg:order-1 lg:px-16">
        <div className="absolute top-6 right-6 z-20 sm:top-10 sm:right-10 lg:top-12 lg:right-16">
          <ThemeToggle />
        </div>
        <div className="mx-auto w-full max-w-sm">
          <Suspense fallback={<SignupFormFallback />}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
      <div className="order-1 lg:order-2">
        <AuthBrandPanel />
      </div>
    </div>
  );
}
