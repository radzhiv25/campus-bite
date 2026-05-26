import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/auth/auth-split-layout";
import { SignupForm } from "@/components/auth/signup-form";
import { ROUTES } from "@/constants/site";
import { isAdminLoginFrom } from "@/lib/admin/login-context";
import { readCampusSession } from "@/lib/session";

type PageProps = {
  searchParams: Promise<{ from?: string }>;
};

function SignupFormFallback() {
  return (
    <div className="flex min-h-[200px] w-full items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  );
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { from } = await searchParams;
  if (isAdminLoginFrom(from)) {
    redirect(`${ROUTES.login}?from=${encodeURIComponent(ROUTES.admin)}`);
  }

  const { authed } = await readCampusSession();
  if (authed) {
    const safeFrom =
      from && from.startsWith("/") && !from.startsWith("//") ? from : ROUTES.menu;
    redirect(safeFrom);
  }

  return (
    <AuthSplitLayout brandPosition="right" formMaxWidth="md">
      <Suspense fallback={<SignupFormFallback />}>
        <SignupForm />
      </Suspense>
    </AuthSplitLayout>
  );
}
