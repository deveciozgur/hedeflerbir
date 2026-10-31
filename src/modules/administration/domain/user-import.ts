import Papa from "papaparse";
import { strongPassword } from "@/modules/identity/domain/password";
import type { Role } from "@/modules/identity/domain/role";
import { createUserSchema, type CreateUserInput } from "./user-admin";

/**
 * Bulk user import from CSV. Header names are matched loosely (Turkish or English),
 * the role column is optional (defaults to STUDENT) and accepts Turkish labels.
 * The password column is optional: rows with a password get it (bcrypt-hashed on the server),
 * rows without one receive a "set your password" invitation instead.
 *
 *   ad,soyad,e-posta,rol,sifre
 *   Ayşe,Kaya,ayse@ornek.com,öğrenci,
 */

export const MAX_IMPORT_ROWS = 500;
/** Rows are written in chunks; a failing row never takes its chunk (or the import) down with it. */
export const IMPORT_CHUNK_SIZE = 50;

/** Static copy for download: public/templates/kullanici_yukleme_sablonu.csv */
export const IMPORT_TEMPLATE_PATH = "/templates/kullanici_yukleme_sablonu.csv";

const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/[\s_-]+/g, "")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

type ImportColumn = keyof CreateUserInput | "password";

const HEADER_ALIASES: Record<ImportColumn, string[]> = {
  name: ["ad", "adi", "isim", "name", "firstname"],
  surname: ["soyad", "soyadi", "surname", "lastname"],
  email: ["eposta", "email", "mail", "emailadresi", "epostaadresi"],
  role: ["rol", "role", "yetki"],
  password: ["sifre", "parola", "password"],
};

const ROLE_ALIASES: Record<string, Role> = {
  ogrenci: "STUDENT",
  katilimci: "STUDENT",
  student: "STUDENT",
  egitmen: "INSTRUCTOR",
  instructor: "INSTRUCTOR",
  mentor: "MENTOR",
  yonetici: "ADMIN",
  admin: "ADMIN",
};

export interface ImportRow extends CreateUserInput {
  line: number;
  /** Plain text from the CSV, hashed before it is stored; null = send an invitation. */
  password: string | null;
}

export interface ImportParseResult {
  rows: ImportRow[];
  errors: Array<{ line: number; message: string }>;
  /** Columns that could not be mapped (fatal when name/surname/email are missing). */
  missingColumns: string[];
}

const COLUMN_LABELS: Record<keyof CreateUserInput, string> = { name: "ad", surname: "soyad", email: "e-posta", role: "rol" };

export function parseUserCsv(text: string): ImportParseResult {
  const parsed = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: "greedy" });
  const [header = [], ...records] = parsed.data;

  const columnOf = (field: ImportColumn) => header.findIndex((h) => HEADER_ALIASES[field].includes(normalize(h)));
  const columns = { name: columnOf("name"), surname: columnOf("surname"), email: columnOf("email"), role: columnOf("role"), password: columnOf("password") };
  const missingColumns = (["name", "surname", "email"] as const).filter((f) => columns[f] === -1).map((f) => COLUMN_LABELS[f]);
  if (missingColumns.length > 0) return { rows: [], errors: [], missingColumns };

  const rows: ImportRow[] = [];
  const errors: ImportParseResult["errors"] = [];
  const seen = new Set<string>();

  records.slice(0, MAX_IMPORT_ROWS).forEach((record, index) => {
    const line = index + 2; // 1-based, after the header row
    const rawRole = columns.role === -1 ? "" : (record[columns.role] ?? "");
    const role = rawRole.trim() ? ROLE_ALIASES[normalize(rawRole)] : "STUDENT";
    if (!role) {
      errors.push({ line, message: `Bilinmeyen rol: "${rawRole.trim()}"` });
      return;
    }
    const result = createUserSchema.safeParse({
      name: record[columns.name] ?? "",
      surname: record[columns.surname] ?? "",
      email: record[columns.email] ?? "",
      role,
    });
    if (!result.success) {
      errors.push({ line, message: result.error.issues[0]?.message ?? "Geçersiz satır" });
      return;
    }
    if (seen.has(result.data.email)) {
      errors.push({ line, message: `${result.data.email} dosyada birden fazla kez geçiyor` });
      return;
    }
    const rawPassword = columns.password === -1 ? "" : (record[columns.password] ?? "").trim();
    const password = rawPassword ? strongPassword.safeParse(rawPassword) : null;
    if (password && !password.success) {
      errors.push({ line, message: password.error.issues[0]?.message ?? "Şifre geçersiz" });
      return;
    }
    seen.add(result.data.email);
    rows.push({ ...result.data, line, password: password?.data ?? null });
  });

  if (records.length > MAX_IMPORT_ROWS) errors.push({ line: MAX_IMPORT_ROWS + 2, message: `En fazla ${MAX_IMPORT_ROWS} satır içe aktarılabilir; kalan satırlar atlandı.` });
  return { rows, errors, missingColumns };
}
