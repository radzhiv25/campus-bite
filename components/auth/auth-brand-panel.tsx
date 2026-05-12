import Link from "next/link";
import { ForkKnifeIcon, SparkleIcon } from "@phosphor-icons/react/ssr";
import { SiSupabase } from "react-icons/si";
import { ROUTES, SITE } from "@/constants/site";

export function AuthBrandPanel() {
  return (
    <div className="relative flex min-h-[42vh] flex-col justify-between overflow-hidden bg-linear-to-br from-primary/90 via-primary to-primary/70 p-8 text-primary-foreground lg:min-h-dvh lg:p-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative">
        <Link
          href={ROUTES.home}
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-primary-foreground/95 hover:text-primary-foreground"
        >
          <ForkKnifeIcon className="size-6 shrink-0" weight="duotone" />
          <span className="capitalize">{SITE.name}</span>
        </Link>
      </div>
      <div className="relative mt-10 max-w-md space-y-4 lg:mt-0">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-medium backdrop-blur-sm">
          <SparkleIcon className="size-3.5" weight="fill" />
          Campus ordering
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Your canteen, one tap away.
        </h1>
        <p className="text-pretty text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
          Sign in to browse the menu, place orders, and skip the queue between classes.
        </p>
      </div>
      <p className="relative flex flex-wrap items-center gap-1 text-xs text-primary-foreground/60">
        <span>Secured with</span>
        <SiSupabase className="size-3 text-[#3FCF8E]" />
        <span className="font-semibold">Supabase Auth</span>
      </p>
    </div>
  );
}
