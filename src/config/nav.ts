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
import type { Action } from "@/lib/rbac";

export type NavChild = {
  label: string;
  href: string;
  permission?: Action;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Megaphone },
  { label: "Tasks", href: "/tasks", icon: ListChecks },
  {
    label: "Leads",
    href: "/leads",
    icon: Users,
    children: [
      { label: "All Leads", href: "/leads" },
      { label: "Clients", href: "/leads/clients" },
    ],
  },
  { label: "Budget", href: "/budget", icon: Wallet },
  { label: "Knowledge", href: "/knowledge", icon: BookOpen },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
    children: [
      { label: "My Profile", href: "/settings" },
      { label: "Users & Roles", href: "/settings/users", permission: "user:manage" },
      { label: "Board Columns", href: "/settings/board", permission: "board:manage_columns" },
      { label: "Workspace", href: "/settings/workspace" },
    ],
  },
];
