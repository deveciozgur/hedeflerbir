import "server-only";
import { configured, warnOnce } from "@/server/config";
import { LocalFileStorage } from "./local";
import { S3FileStorage } from "./s3";
import type { FileStorage } from "./types";

let instance: FileStorage | undefined;

/**
 * Resolves the storage adapter from env: S3/R2 when bucket + credentials are real values,
 * otherwise local disk. In production the disk fallback keeps uploads working (instead of
 * failing every request) but logs a warning, since disk may not survive redeploys.
 */
export function getStorage(): FileStorage {
  if (instance) return instance;

  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (configured(S3_BUCKET) && configured(S3_ACCESS_KEY_ID) && configured(S3_SECRET_ACCESS_KEY)) {
    instance = new S3FileStorage({
      endpoint: configured(S3_ENDPOINT) ? S3_ENDPOINT : undefined,
      region: configured(S3_REGION) ? S3_REGION : "auto",
      bucket: S3_BUCKET,
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    });
  } else {
    if (process.env.NODE_ENV === "production") {
      warnOnce(
        "storage",
        "S3/R2 is not configured — uploads are stored on local disk (UPLOADS_DIR). Configure S3_* before relying on uploads.",
      );
    }
    instance = new LocalFileStorage();
  }
  return instance;
}

export type { FileStorage } from "./types";
