import { Navbar, Footer } from "@/components/layout";
import { readCampusSession } from "@/lib/session";

export default async function AdminPage() {
  const { authed, displayName } = await readCampusSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-background">
      <Navbar authed={authed} displayName={displayName} />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Admin
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage menu items, orders, and canteen settings.
          </p>
          <section className="mt-8 rounded-2xl border border-dashed border-border bg-card p-8">
            <p className="text-sm text-muted-foreground">
              Admin panel—add menu items and manage orders here.
            </p>
          </section>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
