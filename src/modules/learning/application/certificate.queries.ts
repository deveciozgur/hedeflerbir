import "server-only";
import { db } from "@/server/db";
import { fullName } from "@/lib/utils";
import { isVerificationCode, normalizeVerificationCode } from "../domain/certificate";

export interface CertificateRecord {
  code: string;
  holderName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: Date;
}

/** Public lookup by verification code (the code itself is the credential the holder shares). */
export async function findCertificate(rawCode: string): Promise<CertificateRecord | null> {
  const code = normalizeVerificationCode(rawCode);
  if (!isVerificationCode(code)) return null;
  const certificate = await db.certificate.findUnique({
    where: { verificationCode: code },
    select: {
      verificationCode: true,
      issuedAt: true,
      user: { select: { name: true, surname: true } },
      course: { select: { title: true, instructor: { select: { name: true, surname: true } } } },
    },
  });
  if (!certificate) return null;
  return {
    code: certificate.verificationCode,
    holderName: fullName(certificate.user),
    courseTitle: certificate.course.title,
    instructorName: fullName(certificate.course.instructor),
    issuedAt: certificate.issuedAt,
  };
}

export interface StudentCertificate {
  code: string;
  courseTitle: string;
  courseSlug: string;
  issuedAt: Date;
}

export async function getStudentCertificates(userId: string): Promise<StudentCertificate[]> {
  const rows = await db.certificate.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: { verificationCode: true, issuedAt: true, course: { select: { title: true, slug: true } } },
  });
  return rows.map((r) => ({ code: r.verificationCode, courseTitle: r.course.title, courseSlug: r.course.slug, issuedAt: r.issuedAt }));
}
