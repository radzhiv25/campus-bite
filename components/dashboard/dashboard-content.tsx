export function DashboardContent() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">
        Food listings from the admin panel will appear here.
      </p>

      <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-zinc-100 p-6">
        <h2 className="text-lg font-medium text-zinc-900">No listings yet</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Once admins add items, students will be able to order from this page.
        </p>
      </section>
    </div>
  );
}
