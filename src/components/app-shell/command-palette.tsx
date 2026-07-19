"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { globalSearchAction, type SearchResult } from "@/lib/actions/search";
import { Search, CornerDownLeft } from "lucide-react";

const GROUP_ORDER: SearchResult["group"][] = ["Campaigns", "Tasks", "Leads", "Knowledge"];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onToggleEvent() {
      setOpen((v) => !v);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("toggle-command-palette", onToggleEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("toggle-command-palette", onToggleEvent);
    };
  }, []);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const res = await globalSearchAction(value);
      setResults(res);
      setActiveIndex(0);
    }, 200);
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) navigateTo(target.href);
    }
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: results.filter((r) => r.group === group),
  })).filter((g) => g.items.length > 0);

  let flatIndex = -1;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[20%] max-w-lg translate-y-0 gap-0 p-0 sm:max-w-lg"
      >
        <DialogTitle className="sr-only">Search</DialogTitle>
        <DialogDescription className="sr-only">
          Search campaigns, tasks, leads, and knowledge articles.
        </DialogDescription>
        <div className="flex items-center gap-2 border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search campaigns, tasks, leads, knowledge..."
            className="border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {query.trim().length >= 2 && results.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">No results.</p>
          )}
          {query.trim().length < 2 && (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search.
            </p>
          )}
          {grouped.map(({ group, items }) => (
            <div key={group} className="mb-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{group}</div>
              {items.map((item) => {
                flatIndex++;
                const isActive = flatIndex === activeIndex;
                return (
                  <button
                    key={`${item.group}-${item.id}`}
                    type="button"
                    onClick={() => navigateTo(item.href)}
                    onMouseEnter={() => setActiveIndex(flatIndex)}
                    className={`flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm ${
                      isActive ? "bg-accent" : "hover:bg-accent/60"
                    }`}
                  >
                    <span className="truncate">{item.title}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      {item.subtitle && (
                        <Badge variant="outline" className="text-xs">
                          {item.subtitle}
                        </Badge>
                      )}
                      {isActive && <CornerDownLeft className="h-3 w-3 text-muted-foreground" />}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
