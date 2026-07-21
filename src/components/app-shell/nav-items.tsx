"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/config/nav";
import { authorize } from "@/lib/rbac";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const OPEN_GROUPS_KEY = "marketingos:sidebar-open-groups";

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavItems({
  role,
  collapsed = false,
}: {
  role: Role;
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(OPEN_GROUPS_KEY) ?? "[]");
      if (Array.isArray(stored)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a local preference is a legitimate client-only, post-mount concern
        setOpenGroups(stored);
      }
    } catch {
      // ignore malformed persisted state
    }
  }, []);

  useEffect(() => {
    const activeParent = NAV_ITEMS.find((item) =>
      item.children?.some((child) => isActivePath(pathname, child.href)),
    );
    if (!activeParent) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- keeping the active group expanded is a client-only, post-mount concern
    setOpenGroups((prev) =>
      prev.includes(activeParent.href) ? prev : [...prev, activeParent.href],
    );
  }, [pathname]);

  function toggleGroup(href: string) {
    setOpenGroups((prev) => {
      const next = prev.includes(href)
        ? prev.filter((h) => h !== href)
        : [...prev, href];
      localStorage.setItem(OPEN_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <nav className="flex flex-1 flex-col gap-0.5 p-2.5">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);
        const visibleChildren = item.children?.filter(
          (child) => !child.permission || authorize({ id: "", role }, child.permission),
        );
        const hasChildren = !!visibleChildren && visibleChildren.length > 0;

        if (!hasChildren || collapsed) {
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 h-4 w-0.5 rounded-full bg-sidebar-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        }

        const isOpen = openGroups.includes(item.href);

        return (
          <Collapsible
            key={item.href}
            open={isOpen}
            onOpenChange={() => toggleGroup(item.href)}
          >
            <CollapsibleTrigger
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              {isActive && (
                <span className="absolute left-0 h-4 w-0.5 rounded-full bg-sidebar-primary" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate text-left">{item.label}</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                  isOpen && "rotate-180",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-[1.15rem] flex flex-col gap-0.5 border-l border-sidebar-border py-0.5 pl-3.5">
                {visibleChildren.map((child) => {
                  const childActive = isActivePath(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        childActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </nav>
  );
}
