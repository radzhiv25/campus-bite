import { Navbar, Footer } from "@/components/layout";
import { DashboardShell, DashboardContent } from "@/components/dashboard";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-[var(--font-geist-sans)]">
      <Navbar />
      <DashboardShell className="flex-1">
        <DashboardContent />
      </DashboardShell>
      <Footer variant="dashboard" />
    </div>
  );
}
