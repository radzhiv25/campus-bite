"use client";

import { motion } from "framer-motion";
import {
  UtensilsCrossed,
  Clock,
  CheckCircle2,
  Users,
  Coffee,
  Sandwich,
  Cookie,
  Pizza,
} from "lucide-react";
import { cn } from "@/lib/utils";

const HIGHLIGHTS = [
  {
    step: 1,
    title: "Order from class",
    description: "Browse the menu and place your order from anywhere. No need to leave your seat.",
    icon: UtensilsCrossed,
    className: "sm:row-span-2",
    featured: true,
  },
  {
    step: 2,
    title: "Schedule for later",
    description: "Pick a time. Your order is ready when you arrive.",
    icon: Clock,
    className: "",
    featured: false,
  },
  {
    step: 3,
    title: "Skip the queue",
    description: "Grab and go. No more long lines.",
    icon: CheckCircle2,
    className: "",
    featured: false,
  },
  {
    step: null,
    title: "For everyone on campus",
    description: "Students, professors, and staff—one place to order.",
    icon: Users,
    className: "sm:col-span-2",
    featured: false,
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

const ORDER_ICONS = [
  { Icon: Coffee },
  { Icon: Sandwich },
  { Icon: Cookie },
  { Icon: Pizza },
];

function OrderIllustration() {
  return (
    <div
      className="absolute bottom-0 left-5 -right-5 flex h-[30%] min-h-[5rem] items-end justify-between gap-4 overflow-hidden px-2 sm:gap-6"
      aria-hidden
    >
      {ORDER_ICONS.map(({ Icon }, i) => (
        <motion.span
          key={i}
          className="flex flex-1 basis-1 items-center justify-center text-amber-500"
          style={{
            aspectRatio: "1",
            maxHeight: "100%",
          }}
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.12 + i * 0.05, duration: 0.4 }}
        >
          <Icon
            className="h-full w-full max-h-full max-w-full"
            strokeWidth={1.5}
            style={{ filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.06))" }}
          />
        </motion.span>
      ))}
    </div>
  );
}

export function BentoHighlights() {
  return (
    <section className="relative z-10 border-t border-amber-200/40 bg-[#faf8f5] px-4 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          className="text-center text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4 }}
        >
          How it works
        </motion.h2>
        <motion.p
          className="mx-auto mt-2 max-w-lg text-center text-zinc-600"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Three steps to skip the canteen queue
        </motion.p>
        <motion.div
          className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 sm:grid-rows-[auto_auto_auto]"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {HIGHLIGHTS.map((highlight) => {
            const Icon = highlight.icon;
            return (
              <motion.article
                key={highlight.title}
                variants={item}
                transition={{ duration: 0.35 }}
                className={cn(
                  "group relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition overflow-hidden",
                  highlight.featured
                    ? "min-h-[14rem] overflow-hidden border-amber-200 bg-amber-50/50 shadow-amber-100/50 hover:border-amber-300 hover:shadow-md sm:min-h-[16rem]"
                    : "overflow-hidden border-amber-100 hover:border-amber-200 hover:shadow-md",
                  highlight.className
                )}
              >
                <div
                  className={cn(
                    "flex flex-1 flex-col",
                    highlight.featured && "pb-24 sm:pb-28"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition",
                        highlight.featured
                          ? "bg-amber-200/80 text-amber-700"
                          : "bg-amber-100 text-amber-600 group-hover:bg-amber-200/80"
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </span>
                    {highlight.step != null && (
                      <span
                        className="rounded-full bg-zinc-200/80 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-zinc-600"
                        aria-hidden
                      >
                        Step {highlight.step}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-semibold text-zinc-900">
                    {highlight.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                    {highlight.description}
                  </p>
                  {highlight.featured && <OrderIllustration />}
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
