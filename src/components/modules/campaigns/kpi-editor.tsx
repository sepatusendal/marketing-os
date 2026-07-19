"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TargetRow = { name: string; target: string; unit: string };
type ActualRow = { name: string; actual: string };

type Props =
  | {
      mode: "target";
      fieldName: string;
      defaultValue?: { name: string; target: number; unit?: string }[];
    }
  | {
      mode: "actual";
      fieldName: string;
      defaultValue?: { name: string; actual: number }[];
    };

export function KpiEditor(props: Props) {
  const isTarget = props.mode === "target";

  const [targetRows, setTargetRows] = useState<TargetRow[]>(
    isTarget
      ? ((props.defaultValue as { name: string; target: number; unit?: string }[]) ?? []).map(
          (r) => ({ name: r.name, target: String(r.target), unit: r.unit ?? "" }),
        )
      : [],
  );
  const [actualRows, setActualRows] = useState<ActualRow[]>(
    !isTarget
      ? ((props.defaultValue as { name: string; actual: number }[]) ?? []).map((r) => ({
          name: r.name,
          actual: String(r.actual),
        }))
      : [],
  );

  const jsonValue = isTarget
    ? JSON.stringify(
        targetRows
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name,
            target: Number(r.target) || 0,
            unit: r.unit || undefined,
          })),
      )
    : JSON.stringify(
        actualRows
          .filter((r) => r.name.trim())
          .map((r) => ({ name: r.name, actual: Number(r.actual) || 0 })),
      );

  return (
    <div className="space-y-2">
      <input type="hidden" name={props.fieldName} value={jsonValue} />

      {isTarget
        ? targetRows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="KPI name (e.g. Leads)"
                value={row.name}
                onChange={(e) =>
                  setTargetRows((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <Input
                placeholder="Target"
                type="number"
                className="w-28"
                value={row.target}
                onChange={(e) =>
                  setTargetRows((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, target: e.target.value } : r)),
                  )
                }
              />
              <Input
                placeholder="Unit"
                className="w-24"
                value={row.unit}
                onChange={(e) =>
                  setTargetRows((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, unit: e.target.value } : r)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setTargetRows((rows) => rows.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))
        : actualRows.map((row, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="KPI name (must match target)"
                value={row.name}
                onChange={(e) =>
                  setActualRows((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, name: e.target.value } : r)),
                  )
                }
              />
              <Input
                placeholder="Actual"
                type="number"
                className="w-28"
                value={row.actual}
                onChange={(e) =>
                  setActualRows((rows) =>
                    rows.map((r, idx) => (idx === i ? { ...r, actual: e.target.value } : r)),
                  )
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setActualRows((rows) => rows.filter((_, idx) => idx !== i))}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          isTarget
            ? setTargetRows((rows) => [...rows, { name: "", target: "", unit: "" }])
            : setActualRows((rows) => [...rows, { name: "", actual: "" }])
        }
      >
        <Plus className="mr-1 h-3 w-3" />
        Add KPI
      </Button>
    </div>
  );
}
