function csvEscape(cell: unknown): string {
  const s = cell === null || cell === undefined ? "" : String(cell);
  if (/[,"\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(
  filename: string,
  headers: readonly string[],
  rows: Record<string, unknown>[]
): void {
  const head = headers.map(csvEscape).join(",");
  const body = rows
    .map((row) => headers.map((h) => csvEscape(row[h])).join(","))
    .join("\r\n");
  const blob = new Blob([`${head}\r\n${body}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
