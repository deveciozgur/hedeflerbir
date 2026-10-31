import "server-only";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ExportTable } from "@/modules/administration/domain/export-datasets";
import { formatCell } from "./cell-format";
import "./pdf-fonts";

const c = { text: "#18181b", muted: "#71717a", border: "#e4e4e7", header: "#f4f4f5", brand: "#4f46e5" };

const styles = StyleSheet.create({
  page: { fontFamily: "Geist", fontSize: 8, color: c.text, paddingTop: 36, paddingBottom: 44, paddingHorizontal: 32 },
  brandBar: { height: 3, backgroundColor: c.brand, marginBottom: 14, width: 48 },
  brand: { fontSize: 9, fontWeight: 600, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: 600, marginBottom: 4 },
  subtitle: { fontSize: 8, color: c.muted, marginBottom: 16 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: c.border },
  headerRow: { flexDirection: "row", backgroundColor: c.header, borderBottomWidth: 0.75, borderBottomColor: c.border },
  cell: { paddingVertical: 5, paddingHorizontal: 4 },
  headerCell: { paddingVertical: 6, paddingHorizontal: 4, fontWeight: 600, color: c.muted },
  numeric: { textAlign: "right" },
  empty: { paddingVertical: 24, textAlign: "center", color: c.muted },
  footer: { position: "absolute", bottom: 20, left: 32, right: 32, flexDirection: "row", justifyContent: "space-between", color: c.muted, fontSize: 7 },
});

function ReportDocument({ table, generatedAt }: { table: ExportTable; generatedAt: string }) {
  const totalWidth = table.columns.reduce((sum, col) => sum + col.width, 0);
  const widthOf = (w: number) => `${(w / totalWidth) * 100}%`;
  const isNumeric = (format: string) => format !== "text" && format !== "datetime";

  return (
    <Document title={table.title} author="HedeflerBir" creator="HedeflerBir LMS">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View fixed>
          <View style={styles.brandBar} />
          <Text style={styles.brand}>HedeflerBir</Text>
        </View>
        <Text style={styles.title}>{table.title}</Text>
        <Text style={styles.subtitle}>{table.subtitle}</Text>

        <View style={styles.headerRow} fixed>
          {table.columns.map((col) => (
            <Text key={col.key} style={[styles.headerCell, { width: widthOf(col.width) }, isNumeric(col.format) ? styles.numeric : {}]}>
              {col.header}
            </Text>
          ))}
        </View>
        {table.rows.length === 0 ? <Text style={styles.empty}>Seçilen filtrelerle eşleşen kayıt yok.</Text> : null}
        {table.rows.map((row, index) => (
          <View key={index} style={styles.row} wrap={false}>
            {table.columns.map((col) => (
              <Text key={col.key} style={[styles.cell, { width: widthOf(col.width) }, isNumeric(col.format) ? styles.numeric : {}]}>
                {formatCell(row[col.key] ?? null, col.format)}
              </Text>
            ))}
          </View>
        ))}

        <View style={styles.footer} fixed>
          <Text>Oluşturulma: {generatedAt} · app.hedeflerbir.com</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function writePdf(table: ExportTable): Promise<Uint8Array> {
  const generatedAt = new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" }).format(new Date());
  const buffer = await renderToBuffer(<ReportDocument table={table} generatedAt={generatedAt} />);
  return new Uint8Array(buffer);
}
