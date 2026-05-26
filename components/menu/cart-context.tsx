"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { MAX_QUANTITY_PER_MENU_ITEM } from "@/lib/orders/limits";
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
  addOne: (itemId: string) => boolean;
  canAddMore: (itemId: string) => boolean;
  removeOne: (itemId: string) => void;
  removeLine: (itemId: string) => void;
  clearCart: () => void;
  quantity: (itemId: string) => number;
  totalQuantity: number;
  subtotalCents: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const CatalogSetterContext = createContext<((items: MenuItem[]) => void) | null>(null);

function buildCatalogById(items: MenuItem[]): Record<string, MenuItem> {
  return Object.fromEntries(items.map((i) => [i.id, i]));
}

export function CartProvider({
  children,
  catalog: catalogProp,
}: {
  children: ReactNode;
  catalog?: MenuItem[];
}) {
  const [catalog, setCatalog] = useState<MenuItem[]>(() => catalogProp ?? []);

  useEffect(() => {
    if (catalogProp) {
      setCatalog(catalogProp);
    }
  }, [catalogProp]);

  const catalogById = useMemo(() => buildCatalogById(catalog), [catalog]);

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

  const canAddMore = useCallback(
    (itemId: string) => (cart[itemId] ?? 0) < MAX_QUANTITY_PER_MENU_ITEM,
    [cart]
  );

  const addOne = useCallback((itemId: string) => {
    let added = false;
    setCart((prev) => {
      const current = prev[itemId] ?? 0;
      if (current >= MAX_QUANTITY_PER_MENU_ITEM) {
        return prev;
      }
      added = true;
      return { ...prev, [itemId]: current + 1 };
    });
    return added;
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

  const clearCart = useCallback(() => {
    setCart({});
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
  }, [cart, catalogById]);

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
      canAddMore,
      removeOne,
      removeLine,
      clearCart,
      quantity,
      totalQuantity,
      subtotalCents,
    }),
    [
      cart,
      lines,
      isDrawerOpen,
      addOne,
      canAddMore,
      removeOne,
      removeLine,
      clearCart,
      quantity,
      totalQuantity,
      subtotalCents,
      openDrawer,
      closeDrawer,
      toggleDrawer,
    ]
  );

  return (
    <CatalogSetterContext.Provider value={setCatalog}>
      <CartContext.Provider value={value}>{children}</CartContext.Provider>
    </CatalogSetterContext.Provider>
  );
}

/** Sync live menu catalog from a server page into the root cart provider. */
export function CartCatalogSync({ items }: { items: MenuItem[] }) {
  const setCatalog = useContext(CatalogSetterContext);
  useEffect(() => {
    setCatalog?.(items);
  }, [items, setCatalog]);
  return null;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
