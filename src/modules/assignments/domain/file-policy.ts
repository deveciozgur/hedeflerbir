export const MAX_SUBMISSION_BYTES = 20 * 1024 * 1024;

export const ACCEPTED_EXTENSIONS = [
  ".pdf", ".zip", ".rar", ".7z",
  ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
  ".png", ".jpg", ".jpeg", ".txt", ".md",
] as const;

/** Value for the <input accept> attribute. */
export const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

/** Only a short alphanumeric suffix counts as an extension — never anything containing a path separator. */
const extensionOf = (fileName: string) => {
  const match = /\.[a-z0-9]{1,8}$/i.exec(fileName);
  return match ? match[0].toLowerCase() : "";
};

export function validateSubmissionFile(file: { name: string; size: number }): string | null {
  if (file.size === 0) return "Dosya boş görünüyor.";
  if (file.size > MAX_SUBMISSION_BYTES) return "Dosya 20 MB'tan büyük olamaz.";
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(extensionOf(file.name))) {
    return "Bu dosya türü desteklenmiyor. PDF, ZIP, Office belgesi veya görsel yükleyin.";
  }
  return null;
}

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
