export const MAX_SUBMISSION_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [
  ".pdf", ".zip", ".rar", ".7z",
  ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".png", ".jpg", ".jpeg", ".txt", ".md",
] as const;

/** Extension ids an instructor can restrict an assignment to ("pdf", "zip", ...). */
export const FILE_TYPE_OPTIONS = ACCEPTED_EXTENSIONS.map((ext) => ext.slice(1));

/** Per-assignment whitelist (Assignment.acceptedFileTypes); empty means the full platform list. */
export function allowedExtensions(acceptedFileTypes: readonly string[] = []): string[] {
  const restricted = acceptedFileTypes.map((t) => `.${t.toLowerCase()}`).filter((ext) => (ACCEPTED_EXTENSIONS as readonly string[]).includes(ext));
  return restricted.length > 0 ? restricted : [...ACCEPTED_EXTENSIONS];
}

/** Value for the <input accept> attribute. */
export const acceptAttribute = (acceptedFileTypes: readonly string[] = []) => allowedExtensions(acceptedFileTypes).join(",");
export const ACCEPT_ATTRIBUTE = acceptAttribute();

/** Only a short alphanumeric suffix counts as an extension — never anything containing a path separator. */
const extensionOf = (fileName: string) => {
  const match = /\.[a-z0-9]{1,8}$/i.exec(fileName);
  return match ? match[0].toLowerCase() : "";
};

export function validateSubmissionFile(file: { name: string; size: number }, acceptedFileTypes: readonly string[] = []): string | null {
  if (file.size === 0) return "Dosya boş görünüyor.";
  if (file.size > MAX_SUBMISSION_BYTES) return "Dosya 20 MB'tan büyük olamaz.";
  const allowed = allowedExtensions(acceptedFileTypes);
  if (!allowed.includes(extensionOf(file.name))) {
    return acceptedFileTypes.length > 0
      ? `Bu ödev yalnızca şu türleri kabul ediyor: ${allowed.map((e) => e.slice(1).toUpperCase()).join(", ")}.`
      : "Bu dosya türü desteklenmiyor. PDF, ZIP, Office belgesi veya görsel yükleyin.";
  }
  return null;
}

/** Files the grading desk can show inline: PDFs (browser viewer) and raster images. Nothing script-capable. */
const PREVIEW_TYPES: Record<string, { kind: "pdf" | "image"; contentType: string }> = {
  ".pdf": { kind: "pdf", contentType: "application/pdf" },
  ".png": { kind: "image", contentType: "image/png" },
  ".jpg": { kind: "image", contentType: "image/jpeg" },
  ".jpeg": { kind: "image", contentType: "image/jpeg" },
};

export const previewOf = (fileName: string | null | undefined) => (fileName ? (PREVIEW_TYPES[extensionOf(fileName)] ?? null) : null);

/** Keeps the original extension, strips anything unsafe for an object key. */
export function sanitizeFileName(fileName: string): string {
  const ext = extensionOf(fileName);
  const base = fileName
    .slice(0, fileName.length - ext.length)
    .replace(/ı/g, "i") // dotless ı has no NFKD decomposition
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "dosya"}${ext}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
