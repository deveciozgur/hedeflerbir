import { db } from "@/server/db";
import { getSessionUser } from "@/server/auth/guards";
import { getStorage } from "@/server/storage";
import { previewOf } from "@/modules/assignments/domain/file-policy";

/** Authorized submission download: the owning student, the course instructor, or an admin. */
export async function GET(request: Request, { params }: { params: Promise<{ submissionId: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { submissionId } = await params;
  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    select: {
      fileUrl: true,
      fileName: true,
      studentId: true,
      assignment: { select: { course: { select: { instructorId: true } } } },
    },
  });

  const allowed =
    submission &&
    (user.role === "ADMIN" ||
      submission.studentId === user.id ||
      submission.assignment.course.instructorId === user.id);
  if (!allowed) return new Response("Not found", { status: 404 });

  // ?inline=1 lets the grading desk preview PDFs/images in place; other types always download.
  const preview = new URL(request.url).searchParams.get("inline") === "1" ? previewOf(submission.fileName) : null;
  return getStorage().download(
    submission.fileUrl,
    submission.fileName ?? "teslim",
    preview ? { inline: { contentType: preview.contentType, maxAgeSeconds: 300 } } : undefined,
  );
}
