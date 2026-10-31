import { appBaseUrl } from "@/server/config";
import { renderCertificatePdf } from "@/server/export/certificate-pdf";
import { findCertificate } from "@/modules/learning/application/certificate.queries";

/** Certificate PDF, rendered on demand. Public by design: the verification code is what the holder shares. */
export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const certificate = await findCertificate(code);
  if (!certificate) return new Response("Not found", { status: 404 });

  const verifyUrl = new URL(`/verify/${certificate.code}`, appBaseUrl()).toString();
  const pdf = await renderCertificatePdf(certificate, verifyUrl);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="HedeflerBir-Sertifika-${certificate.code}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
