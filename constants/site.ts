export const SITE = {
  name: "campusbite",
  description:
    "Order food from your campus canteen. Skip the line, order from class, or schedule for later.",
  /** Display prices on menu / admin using Intl. */
  menu: {
    currency: "USD",
    locale: "en-US",
  },
} as const;

export const ROUTES = {
  home: "/",
  menu: "/menu",
  cart: "/cart",
  dashboard: "/dashboard",
  admin: "/admin",
  login: "/login",
  signup: "/signup",
} as const;

export const NAV_LINKS = [{ label: "Menu", href: ROUTES.menu }] as const;
