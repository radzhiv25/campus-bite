export const SITE = {
  name: "campusbite",
  description:
    "Order food from your campus canteen. Skip the line, order from class, or schedule for later.",
} as const;

export const ROUTES = {
  home: "/",
  menu: "/menu",
  dashboard: "/dashboard",
  admin: "/admin",
} as const;

export const NAV_LINKS = [
  { label: "Menu", href: ROUTES.menu },
  { label: "Admin", href: ROUTES.admin },
] as const;
