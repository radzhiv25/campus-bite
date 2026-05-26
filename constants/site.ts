export const SITE = {
  name: "campusbite",
  description:
    "Order food from your campus canteen. Skip the line, order from class, or schedule for later.",
  /** Display prices on menu / admin / checkout using Intl (amounts stored as paise in DB). */
  menu: {
    currency: "INR",
    locale: "en-IN",
  },
} as const;

/** Admin form label for menu price inputs. */
export function menuPriceFieldLabel(): string {
  return `Price (${SITE.menu.currency})`;
}

export const ROUTES = {
  home: "/",
  menu: "/menu",
  cart: "/cart",
  checkout: "/checkout",
  dashboard: "/dashboard",
  admin: "/admin",
  adminOrders: "/admin/orders",
  orders: "/orders",
  login: "/login",
  signup: "/signup",
} as const;

export function orderDetailPath(orderId: string) {
  return `${ROUTES.orders}/${orderId}`;
}

export const NAV_LINKS = [{ label: "Menu", href: ROUTES.menu }] as const;
