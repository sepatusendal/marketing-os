"use client";

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

const TYPES = [
  "SOP",
  "EXPERIMENT",
  "MEETING_NOTES",
  "BEST_PRACTICE",
  "CAMPAIGN_REVIEW",
  "LESSONS_LEARNED",
];

export function KnowledgeFilters({ tags }: { tags: string[] }) {
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

  return (
    <div className="flex flex-wrap gap-2">
      <Input
        placeholder="Search title, tags, body..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") updateParam("search", search || null);
        }}
        onBlur={() => updateParam("search", search || null)}
        className="w-64"
      />
      <Select
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => updateParam("type", v === "all" ? null : String(v))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          {TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t.replaceAll("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tags.length > 0 && (
        <Select
          value={searchParams.get("tag") ?? "all"}
          onValueChange={(v) => updateParam("tag", v === "all" ? null : String(v))}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
