"use client";

import { motion } from "framer-motion";
import {
  Apple,
  Banana,
  Beef,
  Cake,
  Candy,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  Donut,
  Egg,
  Fish,
  Grape,
  IceCreamCone,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  Wine,
  Citrus,
} from "lucide-react";
import { LANDING_ICON_POSITIONS } from "@/constants/landing";

const FOOD_ICONS = [
  Apple,
  Banana,
  Beef,
  Cake,
  Candy,
  Carrot,
  Cherry,
  Coffee,
  Cookie,
  Croissant,
  Donut,
  Egg,
  Fish,
  Grape,
  IceCreamCone,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
  Wheat,
  Wine,
  Citrus,
];

type FoodIconsBackgroundProps = {
  /** If true, fills parent (absolute). If false, fills viewport (fixed). */
  contained?: boolean;
};

export function FoodIconsBackground({ contained = true }: FoodIconsBackgroundProps) {
  return (
    <div
      className={`pointer-events-none z-0 ${contained ? "absolute inset-0" : "fixed inset-0"}`}
      aria-hidden
    >
      {FOOD_ICONS.map((Icon, i) => {
        const pos = LANDING_ICON_POSITIONS[i % LANDING_ICON_POSITIONS.length];
        return (
          <motion.div
            key={i}
            className="absolute text-amber-400/80"
            style={{
              left: pos.left,
              top: pos.top,
              width: 28 + (i % 5) * 8,
              height: 28 + (i % 5) * 8,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 0.25 + (i % 4) * 0.1,
              scale: 1,
              y: [0, -6, 0],
              rotate: [0, 3, -2, 0],
            }}
            transition={{
              opacity: { duration: 0.6, delay: i * 0.04 },
              scale: { duration: 0.5, delay: i * 0.03 },
              y: {
                duration: 4 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
              },
              rotate: {
                duration: 6 + (i % 4),
                repeat: Infinity,
                delay: i * 0.15,
              },
            }}
          >
            <Icon className="h-full w-full" strokeWidth={1.5} />
          </motion.div>
        );
      })}
    </div>
  );
}
