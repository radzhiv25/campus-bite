import { Navbar, Footer } from "@/components/layout";
import { Hero, FoodIconsBackground, BentoHighlights } from "@/components/landing";

export default function Home() {
  return (
    <div className="bg-[#faf8f5] font-[var(--font-geist-sans)]">
      {/* Hero section: full viewport with animated icons only here */}
      <section className="relative flex h-screen flex-col overflow-hidden">
        <FoodIconsBackground contained />
        <Navbar className="relative z-10" />
        <Hero />
      </section>
      <BentoHighlights />
      <Footer variant="landing" />
    </div>
  );
}
