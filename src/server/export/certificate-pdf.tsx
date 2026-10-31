import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatFullDate } from "@/lib/format";
import type { CertificateRecord } from "@/modules/learning/application/certificate.queries";
import "./pdf-fonts";

const c = { text: "#18181b", muted: "#71717a", border: "#e4e4e7", brand: "#4f46e5" };
// Passed as bytes: react-pdf does not resolve local file paths reliably on every platform.
const LOGO = { data: readFileSync(join(process.cwd(), "public", "logo.png")), format: "png" as const };

const styles = StyleSheet.create({
  page: { fontFamily: "Geist", color: c.text, padding: 36 },
  frame: { flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingVertical: 48, paddingHorizontal: 64, justifyContent: "space-between" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { height: 26, width: 85 },
  kicker: { fontSize: 9, color: c.muted, letterSpacing: 2, textTransform: "uppercase" },
  body: { gap: 10 },
  bar: { width: 48, height: 3, backgroundColor: c.brand, marginBottom: 8 },
  title: { fontSize: 30, fontWeight: 600 },
  lead: { fontSize: 11, color: c.muted, marginTop: 10 },
  name: { fontSize: 26, fontWeight: 600, marginTop: 2 },
  course: { fontSize: 15, fontWeight: 600, marginTop: 4 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 0.75, borderTopColor: c.border, paddingTop: 16 },
  label: { fontSize: 8, color: c.muted, marginBottom: 3 },
  value: { fontSize: 10, fontWeight: 600 },
  verify: { fontSize: 8, color: c.muted, textAlign: "right" },
});

function CertificateDocument({ certificate, verifyUrl }: { certificate: CertificateRecord; verifyUrl: string }) {
  return (
    <Document title={`${certificate.courseTitle} sertifikası`} author="HedeflerBir" creator="HedeflerBir LMS">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.frame}>
          <View style={styles.header}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt; the PDF title names the document */}
            <Image src={LOGO} style={styles.logo} />
            <Text style={styles.kicker}>Başarı Sertifikası</Text>
          </View>

          <View style={styles.body}>
            <View style={styles.bar} />
            <Text style={styles.title}>Sertifika</Text>
            <Text style={styles.lead}>Bu belge,</Text>
            <Text style={styles.name}>{certificate.holderName}</Text>
            <Text style={styles.lead}>adlı katılımcının aşağıdaki eğitimi başarıyla tamamladığını onaylar.</Text>
            <Text style={styles.course}>{certificate.courseTitle}</Text>
          </View>

          <View style={styles.footer}>
            <View>
              <Text style={styles.label}>Eğitmen</Text>
              <Text style={styles.value}>{certificate.instructorName}</Text>
            </View>
            <View>
              <Text style={styles.label}>Veriliş tarihi</Text>
              <Text style={styles.value}>{formatFullDate(certificate.issuedAt)}</Text>
            </View>
            <View>
              <Text style={styles.label}>Doğrulama kodu</Text>
              <Text style={styles.value}>{certificate.code}</Text>
              <Text style={styles.verify}>{verifyUrl}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export function renderCertificatePdf(certificate: CertificateRecord, verifyUrl: string): Promise<Buffer> {
  return renderToBuffer(<CertificateDocument certificate={certificate} verifyUrl={verifyUrl} />);
}
