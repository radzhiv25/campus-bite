"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MOCK_MENU_ITEMS } from "@/lib/menu/mock-data";
import type { MenuItem } from "@/lib/menu/types";

export type CartMap = Record<string, number>;

export type CartLine = {
  item: MenuItem;
  quantity: number;
  lineSubtotalCents: number;
};

type CartContextValue = {
  cart: CartMap;
  lines: CartLine[];
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  addOne: (itemId: string) => void;
  removeOne: (itemId: string) => void;
  removeLine: (itemId: string) => void;
  quantity: (itemId: string) => number;
  totalQuantity: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const catalogById: Record<string, MenuItem> = Object.fromEntries(
  MOCK_MENU_ITEMS.map((i) => [i.id, i])
);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartMap>({});
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const addOne = useCallback((itemId: string) => {
    setCart((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? 0) + 1,
    }));
  }, []);

  const removeOne = useCallback((itemId: string) => {
    setCart((prev) => {
      const q = prev[itemId] ?? 0;
      if (q <= 1) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: q - 1 };
    });
  }, []);

  const removeLine = useCallback((itemId: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  }, []);

  const quantity = useCallback((itemId: string) => cart[itemId] ?? 0, [cart]);

  const lines = useMemo(() => {
    return Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, qty]) => {
        const item = catalogById[id];
        if (!item) return null;
        return {
          item,
          quantity: qty,
          lineSubtotalCents: item.price_cents * qty,
        } satisfies CartLine;
      })
      .filter((row): row is CartLine => row != null);
  }, [cart]);

  const totalQuantity = useMemo(
    () => Object.values(cart).reduce((sum, n) => sum + n, 0),
    [cart]
  );

  const subtotalCents = useMemo(
    () => lines.reduce((sum, row) => sum + row.lineSubtotalCents, 0),
    [lines]
  );

  const value = useMemo(
    () => ({
      cart,
      lines,
      isDrawerOpen,
      setDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      addOne,
      removeOne,
      removeLine,
      quantity,
      totalQuantity,
      subtotalCents,
    }),
    [
      cart,
      lines,
      isDrawerOpen,
      addOne,
      removeOne,
      removeLine,
      quantity,
      totalQuantity,
      subtotalCents,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
