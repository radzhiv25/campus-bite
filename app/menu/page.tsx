import { Navbar, Footer } from "@/components/layout";
import { MenuBrowser } from "@/components/menu";
import { readCampusSession } from "@/lib/session";
import { fetchMenuItems } from "@/lib/menu/queries";

export default async function MenuPage() {
  const { authed, displayName } = await readCampusSession();
  const items = await fetchMenuItems();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <Navbar authed={authed} displayName={displayName} />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full min-w-0 max-w-full md:max-w-[calc(50vw-2rem)]">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Canteen menu</h1>
          <p className="mt-1 text-muted-foreground">
            {authed && displayName ? (
              <>
                Hi, <span className="font-medium text-foreground">{displayName}</span>. Order from the canteen or
                schedule for later.
              </>
            ) : (
              <>Browse the menu and sign in when you are ready to order.</>
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Sample items below are static placeholders until a backend schema is added.
          </p>
          <div className="mt-8">
            <MenuBrowser items={items} />
          </div>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
