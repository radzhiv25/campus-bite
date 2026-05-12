"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { ROUTES } from "@/constants/site";

export function Hero() {
  return (
    <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-12">
      <motion.div
        className="flex max-w-xl flex-col items-center text-center"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.06, delayChildren: 0.1 },
          },
        }}
      >
        <motion.h1
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl"
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          Order from your canteen.{" "}
          <span className="text-amber-600 dark:text-amber-400">Skip the queue.</span>
        </motion.h1>
        <motion.p
          className="mt-4 text-muted-foreground"
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          Order from class or schedule for later.
        </motion.p>
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.4 }}
        >
          <Link href={ROUTES.menu} className="mt-8 inline-block">
            <motion.span
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-6 text-sm font-semibold text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              Start ordering
              <ChevronRight className="h-4 w-4" />
            </motion.span>
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
