/** Unambiguous alphabet (no 0/O, 1/I/L) so a code read off a printed certificate types back correctly. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** e.g. "HB-7K4Q-X9MD": 8 random symbols ≈ 40 bits, unique-indexed in the database. */
export function generateVerificationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const symbols = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `HB-${symbols.slice(0, 4)}-${symbols.slice(4)}`;
}

export const normalizeVerificationCode = (raw: string) => raw.trim().toUpperCase();

export const isVerificationCode = (value: string) => /^HB-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(value);
