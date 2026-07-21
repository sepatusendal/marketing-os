function escapeCsvCell(value: unknown): string {
  let str = value == null ? "" : String(value);
  // Formula injection: a cell opening with =, +, -, @, tab, or CR is
  // interpreted as a formula by Excel/Sheets/Numbers when the CSV is
  // opened. Prefixing with an apostrophe forces text interpretation.
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[], columns: { key: string; label: string }[]) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(row[c.key])).join(","))
    .join("\n");
  return `${header}\n${body}`;
}
