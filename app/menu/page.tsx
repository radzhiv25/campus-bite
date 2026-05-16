import { Navbar, Footer } from "@/components/layout";
import { MenuBrowser } from "@/components/menu";
import Link from "next/link";
import { ROUTES } from "@/constants/site";
import { fetchMenuItems } from "@/lib/menu/queries";
import { readCampusSession } from "@/lib/session";

export default async function MenuPage() {
  const session = await readCampusSession();
  const items = await fetchMenuItems();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <Navbar
        authed={session.authed}
        displayName={session.displayName}
        isAdmin={session.isAdmin}
      />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Canteen menu</h1>
          <p className="mt-1 text-muted-foreground">
            {session.authed && session.displayName ? (
              <>
                Hi, <span className="font-medium text-foreground">{session.displayName}</span>. Here is what we are
                serving today.
              </>
            ) : (
              <>Browse the menu and sign in when you are ready to order.</>
            )}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Items are managed by admins in the dashboard. If this list is empty, create the{" "}
            <code className="rounded bg-muted px-1">menu_items</code> table in Supabase and add rows from the admin
            dashboard.
          </p>
          <div className="mt-8">
            <MenuBrowser items={items} />
          </div>
          {!session.authed ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href={`${ROUTES.login}?from=${encodeURIComponent(ROUTES.menu)}`} className="font-medium text-primary underline-offset-4 hover:underline">
                Sign in
              </Link>{" "}
              to continue with your account.
            </p>
          ) : null}
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
