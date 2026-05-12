import { Navbar, Footer } from "@/components/layout";
import { Hero, FoodIconsBackground, BentoHighlights } from "@/components/landing";
import { readCampusSession } from "@/lib/session";

export default async function Home() {
  const { authed, displayName } = await readCampusSession();

  return (
    <div className="bg-[#faf8f5] font-sans dark:bg-background">
      {/* Hero section: full viewport with animated icons only here */}
      <section className="relative flex h-screen flex-col overflow-hidden">
        <FoodIconsBackground contained />
        <Navbar overlay authed={authed} displayName={displayName} />
        <Hero />
      </section>
      <BentoHighlights />
      <Footer variant="landing" />
    </div>
  );
}
