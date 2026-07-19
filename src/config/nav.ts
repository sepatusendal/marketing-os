import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Megaphone,
  ListChecks,
  Users,
  Wallet,
  BookOpen,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Budget", href: "/budget", icon: Wallet },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];
