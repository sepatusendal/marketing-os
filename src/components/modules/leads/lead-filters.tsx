"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SOURCES = [
  "WEBSITE",
  "WHATSAPP",
  "INSTAGRAM",
  "TIKTOK",
  "REFERRAL",
  "EVENT",
  "PAID_ADS",
  "EMAIL",
  "OTHER",
];

export function LeadFilters({ view }: { view: "board" | "table" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function viewUrl(v: "board" | "table") {
    const params = new URLSearchParams(searchParams.toString());
    if (v === "board") params.delete("view");
    else params.set("view", "table");
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Search leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateParam("search", search || null);
          }}
          onBlur={() => updateParam("search", search || null)}
          className="w-52"
        />
        <Select
          value={searchParams.get("source") ?? "all"}
          onValueChange={(v) => updateParam("source", v === "all" ? null : String(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {SOURCES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-1 rounded-md border p-0.5">
        <Link
          href={viewUrl("board")}
          className={cn(
            "rounded px-3 py-1 text-sm",
            view === "board" ? "bg-secondary" : "text-muted-foreground",
          )}
        >
          Board
        </Link>
        <Link
          href={viewUrl("table")}
          className={cn(
            "rounded px-3 py-1 text-sm",
            view === "table" ? "bg-secondary" : "text-muted-foreground",
          )}
        >
          Table
        </Link>
      </div>
    </div>
  );
}
