import "server-only";
import { LocalFileStorage } from "./local";
import { S3FileStorage } from "./s3";
import type { FileStorage } from "./types";

let instance: FileStorage | undefined;

/** Resolves the storage adapter from env: S3/R2 when configured, local disk in development. */
export function getStorage(): FileStorage {
  if (instance) return instance;

  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (S3_BUCKET && S3_ACCESS_KEY_ID && S3_SECRET_ACCESS_KEY) {
    instance = new S3FileStorage({
      endpoint: S3_ENDPOINT,
      region: S3_REGION || "auto",
      bucket: S3_BUCKET,
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    });
  } else if (process.env.NODE_ENV === "production") {
    throw new Error("S3/R2 storage is not configured (S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY).");
  } else {
    instance = new LocalFileStorage();
  }
  return instance;
}

export type { FileStorage } from "./types";
