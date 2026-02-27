import { Navbar, Footer } from "@/components/layout";

export default function MenuPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f5] font-[var(--font-geist-sans)]">
      <Navbar />
      <main className="relative z-10 flex flex-1 flex-col px-4 py-8">
        <div className="mx-auto w-full max-w-4xl">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Canteen menu
          </h1>
          <p className="mt-1 text-zinc-600">
            Order from the canteen. Pick up or schedule for later.
          </p>
          <section className="mt-8 rounded-2xl border border-amber-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-zinc-500">
              Menu items will appear here once the admin adds them.
            </p>
          </section>
        </div>
      </main>
      <Footer variant="dashboard" />
    </div>
  );
}
