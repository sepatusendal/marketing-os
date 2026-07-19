"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["DRAFT", "PLANNING", "RUNNING", "COMPLETED", "ARCHIVED"];

export function CampaignFilters({
  departments,
  owners,
}: {
  departments: string[];
  owners: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("cursor");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search campaigns..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("search", search || null);
        }}
        onBlur={() => updateParam("search", search || null)}
        className="w-56"
      />

      <Select
        value={searchParams.get("status") ?? "all"}
        onValueChange={(v) => updateParam("status", v === "all" ? null : String(v))}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {departments.length > 0 && (
        <Select
          value={searchParams.get("department") ?? "all"}
          onValueChange={(v) => updateParam("department", v === "all" ? null : String(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={searchParams.get("ownerId") ?? "all"}
        onValueChange={(v) => updateParam("ownerId", v === "all" ? null : String(v))}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All owners</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
