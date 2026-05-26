import Link from "next/link";

import { CartPageView } from "@/components/cart/cart-page-view";
import { Navbar, Footer } from "@/components/layout";
import { CartCatalogSync } from "@/components/menu/cart-context";
import { ROUTES } from "@/constants/site";
import { fetchMenuItems } from "@/lib/menu/queries";
import { readCampusSession } from "@/lib/session";

export default async function CartPage() {
  const session = await readCampusSession();
  const items = await fetchMenuItems();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-sans dark:bg-background">
      <CartCatalogSync items={items} />
      <Navbar
        authed={session.authed}
        displayName={session.displayName}
        isAdmin={session.isAdmin}
      />
      <main className="relative z-10 flex flex-1 flex-col items-center px-4 py-8">
        <div className="mx-auto w-full min-w-0 max-w-full md:max-w-[calc(50vw-2rem)]">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Your cart</h1>
          <p className="mt-1 text-muted-foreground">Review items and continue when you are ready to order.</p>
          <div className="mt-8">
            <CartPageView authed={session.authed} />
          </div>
          {!session.authed ? (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link
                href={`${ROUTES.login}?from=${encodeURIComponent(ROUTES.cart)}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>{" "}
              to continue to checkout.
            </p>
          ) : null}
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
