import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { attachmentDisposition, type DownloadOptions, type FileStorage } from "./types";

/**
 * Disk adapter — development default, and the production fallback until S3/R2 is configured.
 * Files live in UPLOADS_DIR (default ./.uploads, git-ignored). On a host that wipes the app
 * folder on redeploy, point UPLOADS_DIR at a persistent directory outside it.
 */
export class LocalFileStorage implements FileStorage {
  private readonly root = resolve(process.cwd(), process.env.UPLOADS_DIR?.trim() || ".uploads");

  private pathFor(key: string): string {
    const target = resolve(join(this.root, key));
    if (!target.startsWith(this.root + sep)) throw new Error(`Invalid storage key: ${key}`);
    return target;
  }

  async put(key: string, body: Uint8Array): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }

  async download(key: string, fileName: string, options?: DownloadOptions): Promise<Response> {
    const data = await readFile(this.pathFor(key));
    const headers: Record<string, string> = options?.inline
      ? {
          "Content-Type": options.inline.contentType,
          "Cache-Control": `private, max-age=${options.inline.maxAgeSeconds}, immutable`,
          "X-Content-Type-Options": "nosniff",
        }
      : {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": attachmentDisposition(fileName),
          "Cache-Control": "private, no-store",
        };
    return new Response(new Uint8Array(data), { headers });
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
