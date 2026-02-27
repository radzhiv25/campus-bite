import { Navbar, Footer } from "@/components/layout";

export default function AdminPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-[var(--font-geist-sans)]">
      <Navbar />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Admin
          </h1>
          <p className="mt-1 text-zinc-600">
            Manage menu items, orders, and canteen settings.
          </p>
          <section className="mt-8 rounded-2xl border border-dashed border-zinc-300 bg-white p-8">
            <p className="text-sm text-zinc-500">
              Admin panel—add menu items and manage orders here.
            </p>
          </section>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
