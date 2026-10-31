import { getSessionUser } from "@/server/auth/guards";
import { writeCsv } from "@/server/export/csv";
import { writePdf } from "@/server/export/pdf";
import { writeXlsx } from "@/server/export/xlsx";
import { buildExportTable } from "@/modules/administration/application/export-data";
import { exportFileName, exportQuerySchema, toFilters, type ExportFormat, type ExportTable } from "@/modules/administration/domain/export-datasets";

export const runtime = "nodejs";

const WRITERS: Record<ExportFormat, { contentType: string; write: (t: ExportTable) => Uint8Array | Promise<Uint8Array> }> = {
  csv: { contentType: "text/csv; charset=utf-8", write: writeCsv },
  xlsx: { contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", write: writeXlsx },
  pdf: { contentType: "application/pdf", write: writePdf },
};

/** GET /api/admin/exports?dataset=participants&format=xlsx&courseId=…&from=YYYY-MM-DD&to=YYYY-MM-DD */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const params = Object.fromEntries([...new URL(request.url).searchParams].filter(([, v]) => v !== ""));
  const query = exportQuerySchema.safeParse(params);
  if (!query.success) return Response.json({ error: "Geçersiz dışa aktarma parametreleri." }, { status: 400 });

  const table = await buildExportTable(query.data.dataset, toFilters(query.data));
  const writer = WRITERS[query.data.format];
  const body = await writer.write(table);

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": writer.contentType,
      "Content-Disposition": `attachment; filename="${exportFileName(query.data.dataset, query.data.format)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
