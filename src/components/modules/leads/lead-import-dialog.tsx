"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { parseCsvToObjects } from "@/lib/csv-parse";
import { bulkImportLeadsAction, type ImportRow, type ImportResult } from "@/app/(app)/leads/actions";
import { cn } from "@/lib/utils";

const EXPECTED_COLUMNS = ["name", "company", "phone", "industry", "source", "potentialRevenue", "notes"];

export function LeadImportDialog() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"file" | "paste">("file");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function loadRowsFromText(text: string) {
    const parsed = parseCsvToObjects(text) as ImportRow[];
    setRows(parsed.filter((r) => r.name?.trim()));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    file.text().then(loadRowsFromText);
  }

  function handlePasteChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const text = e.target.value;
    setPasteText(text);
    setResult(null);
    loadRowsFromText(text);
  }

  async function handleImport() {
    setImporting(true);
    try {
      const res = await bulkImportLeadsAction(rows);
      setResult(res);
      if (res.created > 0) {
        toast.success(`Imported ${res.created} lead${res.created === 1 ? "" : "s"}`);
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setRows([]);
      setFileName("");
      setPasteText("");
      setResult(null);
      setMode("file");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Upload className="mr-1 h-4 w-4" />
        Import Leads
      </Button>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import leads</DialogTitle>
          <DialogDescription>
            Columns: {EXPECTED_COLUMNS.join(", ")}. Only <code>name</code> is required — leave the
            rest blank if you don&apos;t have the data. Owner and campaign can be assigned after import.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-md border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "flex-1 rounded px-3 py-1",
              mode === "file" ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            Upload CSV file
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={cn(
              "flex-1 rounded px-3 py-1",
              mode === "paste" ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            Paste from Sheets
          </button>
        </div>

        {mode === "file" ? (
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="text-sm"
          />
        ) : (
          <div className="space-y-1">
            <Textarea
              placeholder={`Select your rows in Google Sheets (including the header row), copy (Cmd/Ctrl+C), then paste here.\n\nname\tcompany\tphone\n...`}
              value={pasteText}
              onChange={handlePasteChange}
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Copying a range straight out of Google Sheets works as-is — no need to export a .csv first.
            </p>
          </div>
        )}

        {rows.length > 0 && !result && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {mode === "file" && fileName ? `${fileName} — ` : ""}
              {rows.length} row{rows.length === 1 ? "" : "s"} ready to import.
            </p>
            <div className="max-h-52 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 8).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.company || "—"}</TableCell>
                      <TableCell>{r.source || "OTHER"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {rows.length > 8 && (
              <p className="text-xs text-muted-foreground">+ {rows.length - 8} more rows</p>
            )}
          </div>
        )}

        {result && (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <p className="font-medium text-primary">{result.created} lead{result.created === 1 ? "" : "s"} imported</p>
            {result.duplicates > 0 && (
              <p className="text-amber-600 dark:text-amber-400">
                {result.duplicates} matched an existing lead by name/company — imported anyway, review for duplicates.
              </p>
            )}
            {result.invalid.length > 0 && (
              <div className="text-destructive">
                <p>{result.invalid.length} row(s) skipped:</p>
                <ul className="ml-4 list-disc">
                  {result.invalid.map((inv) => (
                    <li key={inv.row}>
                      Row {inv.row} ({inv.name}): {inv.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            onClick={handleImport}
            disabled={rows.length === 0 || importing || !!result}
          >
            {importing ? "Importing..." : `Import ${rows.length || ""} lead${rows.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
