"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, FileUp, ClipboardPaste, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";
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
  const [dragActive, setDragActive] = useState(false);

  function loadRowsFromText(text: string) {
    const parsed = parseCsvToObjects(text) as ImportRow[];
    setRows(parsed.filter((r) => r.name?.trim()));
  }

  function loadFile(file: File) {
    setFileName(file.name);
    setResult(null);
    file.text().then(loadRowsFromText);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  }

  function clearFile() {
    setFileName("");
    setRows([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      setDragActive(false);
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

        <div className="grid grid-cols-2 gap-1.5 rounded-lg border bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              mode === "file"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <FileUp className="h-3.5 w-3.5" />
            Upload CSV file
          </button>
          <button
            type="button"
            onClick={() => setMode("paste")}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all",
              mode === "paste"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
            )}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            Paste from Sheets
          </button>
        </div>

        {mode === "file" ? (
          fileName ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName}</p>
                <p className="text-xs text-muted-foreground">
                  {rows.length} row{rows.length === 1 ? "" : "s"} detected
                </p>
              </div>
              <button
                type="button"
                onClick={clearFile}
                aria-label="Remove file"
                className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileUp className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">
                Drop your CSV here, or <span className="text-primary">browse</span>
              </p>
              <p className="text-xs text-muted-foreground">.csv files only</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )
        ) : (
          <div className="space-y-1.5">
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

        {rows.length > 0 && !result && (mode === "paste" || fileName) && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              {rows.length} row{rows.length === 1 ? "" : "s"} ready to import
            </div>
            <div className="max-h-52 overflow-y-auto rounded-lg border">
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
                    <TableRow key={i} className="hover:bg-muted/40">
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.company || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{r.source || "OTHER"}</TableCell>
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
          <div className="space-y-1.5 rounded-lg border bg-muted/20 p-3 text-sm">
            <p className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {result.created} lead{result.created === 1 ? "" : "s"} imported
            </p>
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
          {result ? (
            <Button onClick={() => handleOpenChange(false)}>Done</Button>
          ) : (
            <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
              {importing ? "Importing..." : `Import ${rows.length || ""} lead${rows.length === 1 ? "" : "s"}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
