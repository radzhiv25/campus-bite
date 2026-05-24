import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { LoginForm } from "@/components/auth/login-form";
import { ROUTES } from "@/constants/site";
import { readCampusSession } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

function LoginFormFallback() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { authed } = await readCampusSession();
  if (authed) {
    const { from } = await searchParams;
    const safeFrom =
      from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;
    redirect(safeFrom);
  }

  return (
    <AuthSplitLayout brandPosition="left" formMaxWidth="sm">
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
