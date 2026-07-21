"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { Role } from "@prisma/client";
import { NavItems } from "./nav-items";

const COLLAPSE_KEY = "marketingos:sidebar-collapsed";

export function AppSidebar({ role }: { role: Role }) {
  const [collapsed, setCollapsed] = useState(false);

  // Reading the persisted preference is inherently a client-only, post-mount
  // concern — doing it during render would mismatch the server-rendered HTML.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring a local preference is a legitimate client-only, post-mount concern
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "glass-panel hidden shrink-0 flex-col border-r text-sidebar-foreground transition-[width] duration-200 ease-in-out md:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "justify-between px-4",
        )}
      >
        {!collapsed && (
          <span className="flex min-w-0 items-center gap-2">
            <Image
              src="/logo-nufa.png"
              alt="Nufa Global Education"
              width={84}
              height={24}
              className="h-6 w-auto shrink-0"
            />
            <span className="truncate font-heading text-[15px] font-semibold tracking-tight">
              MarketingOS
            </span>
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <NavItems role={role} collapsed={collapsed} />

      <div
        className={cn(
          "border-t border-sidebar-border py-3 text-center text-xs text-sidebar-foreground/40",
          collapsed ? "px-1" : "px-3",
        )}
      >
        {collapsed ? (
          <span title="Built with care by Nufa Global">♥</span>
        ) : (
          <>
            <span>Built with care by Nufa Global</span>
            <a
              href="https://github.com/sepatusendal"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 block text-[10px] text-sidebar-foreground/30 hover:text-sidebar-foreground/60"
            >
              Built by @sepatusendal
            </a>
          </>
        )}
      </div>
    </aside>
  );
}
