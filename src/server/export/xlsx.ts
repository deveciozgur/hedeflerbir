import "server-only";
import ExcelJS from "exceljs";
import type { ExportTable } from "@/modules/administration/domain/export-datasets";

/** Excel sheet names: max 31 chars, none of * ? : \ / [ ], and no leading/trailing apostrophe. */
export const sheetName = (title: string) =>
  title.replace(/[*?:\\/[\]]/g, "-").replace(/^'+|'+$/g, "").slice(0, 31).trim() || "Rapor";

const NUM_FMT ={ number: "0", percent: '0"%"', datetime: "dd.mm.yyyy hh:mm", text: "@" } as const;

/** Native-typed workbook: numbers stay numbers, dates stay dates, so admins can pivot and filter. */
export async function writeXlsx(table: ExportTable): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HedeflerBir";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(sheetName(table.title), { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = table.columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width + 2,
    style: { numFmt: NUM_FMT[c.format] },
  }));

  for (const row of table.rows) sheet.addRow(row);

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FF18181B" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF4F4F5" } };
  header.alignment = { vertical: "middle" };
  header.height = 22;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: table.columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}
