/** Audit trail vocabulary. Stored as plain strings so new events need no migration. */
export const AUDIT_ACTIONS = {
  "auth.login_success": "Başarılı giriş",
  "auth.login_failed": "Başarısız giriş",
  "auth.password_reset": "Şifre sıfırlandı",
  "user.created": "Kullanıcı oluşturuldu",
  "user.imported": "Toplu kullanıcı içe aktarımı",
  "user.role_changed": "Rol değiştirildi",
  "user.activated": "Hesap etkinleştirildi",
  "user.deactivated": "Hesap askıya alındı",
  "enrollment.removed": "Kayıt silindi",
  "curriculum.module_deleted": "Bölüm silindi",
  "curriculum.lesson_deleted": "Ders silindi",
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

export const isAuditAction = (value: string): value is AuditAction => value in AUDIT_ACTIONS;

/** Filter groups on the audit page. */
export const AUDIT_FILTERS = [
  { value: "all", label: "Tümü", prefix: "" },
  { value: "auth", label: "Giriş", prefix: "auth." },
  { value: "user", label: "Kullanıcı", prefix: "user." },
  { value: "deletion", label: "Silme", prefix: "" },
] as const;
export type AuditFilter = (typeof AUDIT_FILTERS)[number]["value"];

export const DELETION_ACTIONS: AuditAction[] = ["enrollment.removed", "curriculum.module_deleted", "curriculum.lesson_deleted"];

/** Severity drives the row badge colour. */
export function auditTone(action: string): "destructive" | "warning" | "success" | "outline" {
  if (action === "auth.login_failed") return "destructive";
  if (DELETION_ACTIONS.includes(action as AuditAction) || action === "user.deactivated" || action === "user.role_changed") return "warning";
  if (action === "auth.login_success" || action === "user.activated") return "success";
  return "outline";
}
