/**
 * Utility to generate and download Excel-compatible CSV files on Windows.
 * Prepends UTF-8 BOM (\uFEFF) and uses semicolons as column separators.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escapeCell = (cell: string | number | null | undefined) => {
    const str = cell !== null && cell !== undefined ? String(cell) : "";
    if (str.includes(";") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(";"),
    ...rows.map((row) => row.map(escapeCell).join(";")),
  ];

  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
