import { Navbar, Footer } from "@/components/layout";
import { DashboardShell, DashboardContent } from "@/components/dashboard";
import { readCampusSession } from "@/lib/session";

export default async function DashboardPage() {
  const { authed, displayName } = await readCampusSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-background">
      <Navbar authed={authed} displayName={displayName} />
      <DashboardShell className="flex-1">
        <DashboardContent />
      </DashboardShell>
      <Footer variant="dashboard" />
    </div>
  );
}
