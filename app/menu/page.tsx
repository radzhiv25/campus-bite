import { Navbar, Footer } from "@/components/layout";
import { readCampusSession } from "@/lib/session";

export default async function MenuPage() {
  const { authed, displayName } = await readCampusSession();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <Navbar authed={authed} displayName={displayName} />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Canteen menu
          </h1>
          <p className="mt-1 text-muted-foreground">
            {authed && displayName ? (
              <>
                Hi,{" "}
                <span className="font-medium text-foreground">{displayName}</span>.
                Order from the canteen or schedule for later.
              </>
            ) : (
              <>Browse the menu and order when you are ready.</>
            )}
          </p>
          <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Menu items will appear here once the admin adds them.
            </p>
          </section>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
