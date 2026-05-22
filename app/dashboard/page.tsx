import { redirect } from "next/navigation";

import { Navbar, Footer } from "@/components/layout";
import { DashboardShell, DashboardContent } from "@/components/dashboard";
import { ROUTES } from "@/constants/site";
import { fetchMenuItems } from "@/lib/menu/queries";
import { readCampusSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await readCampusSession();
  if (!session.authed) {
    redirect(`${ROUTES.login}?from=${encodeURIComponent(ROUTES.dashboard)}`);
  }

  const menuItems = session.isAdmin ? await fetchMenuItems() : [];

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-background">
      <Navbar
        authed={session.authed}
        displayName={session.displayName}
        isAdmin={session.isAdmin}
      />
      <DashboardShell className="flex-1">
        <DashboardContent authed={session.authed} isAdmin={session.isAdmin} menuItems={menuItems} />
      </DashboardShell>
      <Footer variant="dashboard" />
    </div>
  );
}
