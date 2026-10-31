import "server-only";
import Papa from "papaparse";
import type { ExportTable } from "@/modules/administration/domain/export-datasets";
import { formatCell } from "./cell-format";

/** Cells starting with these are interpreted as formulas by spreadsheet apps (CSV injection). */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;
const neutralize = (text: string) => (FORMULA_PREFIX.test(text) ? `'${text}` : text);

/** UTF-8 with BOM and `;` delimiter — opens correctly in Excel with Turkish regional settings. */
export function writeCsv(table: ExportTable): Uint8Array {
  const csv = Papa.unparse(
    {
      fields: table.columns.map((c) => c.header),
      data: table.rows.map((row) =>
        table.columns.map((c) => {
          const value = row[c.key] ?? null;
          return typeof value === "string" ? neutralize(value) : formatCell(value, c.format);
        }),
      ),
    },
    { delimiter: ";", newline: "\r\n" },
  );
  return new TextEncoder().encode(`﻿${csv}`);
}
