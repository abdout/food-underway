type IconKey = keyof typeof import("./icons").Icons;

export type PlatformNavItem = {
  title: string;
  href: string;
  icon: IconKey;
  className?: string;
};

export const platformNav: PlatformNavItem[] = [
  // Developer (operator) – developer only
  { title: "Overview", href: "/operator/overview", icon: "box" },
  { title: "Kanban", href: "/operator/kanban", icon: "checkCircle" },
  { title: "Products", href: "/operator/product", icon: "file" },
  { title: "Domains", href: "/operator/domains", icon: "browser" },
  { title: "Billing", href: "/operator/billing", icon: "pieChart" },
  { title: "Observability", href: "/operator/observability", icon: "barChart" },
  { title: "Tenants", href: "/operator/tenants", icon: "envelope" },
  { title: "Dev Profile", href: "/operator/profile", icon: "cog" },
];


