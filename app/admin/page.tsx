import { redirect } from "next/navigation";

import { Navbar, Footer } from "@/components/layout";
import { AdminMenuPanel } from "@/components/dashboard/admin-menu-panel";
import { ROUTES } from "@/constants/site";
import { fetchMenuItems } from "@/lib/menu/queries";
import { readCampusSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await readCampusSession();

  if (!session.authed) {
    redirect(`${ROUTES.login}?from=${encodeURIComponent(ROUTES.admin)}`);
  }
  if (!session.isAdmin) {
    redirect(ROUTES.dashboard);
  }

  const items = await fetchMenuItems();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-background">
      <Navbar authed={session.authed} displayName={session.displayName} isAdmin />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full min-w-0 max-w-full md:max-w-[calc(50vw-2rem)]">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Admin</h1>
          <p className="mt-1 text-muted-foreground">
            Manage menu items. The same tools are available on the dashboard for admin accounts.
          </p>
          <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
            <AdminMenuPanel items={items} />
          </div>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
