import "server-only";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { attachmentDisposition, type DownloadOptions, type FileStorage } from "./types";

export interface S3StorageConfig {
  endpoint?: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

const DOWNLOAD_URL_TTL_SECONDS = 300;

/** AWS S3 / Cloudflare R2 adapter. Downloads are served via short-lived presigned URLs. */
export class S3FileStorage implements FileStorage {
  private readonly client: S3Client;

  constructor(private readonly config: S3StorageConfig) {
    this.client = new S3Client({
      region: config.region,
      endpoint: config.endpoint || undefined,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.config.bucket, Key: key, Body: body, ContentType: contentType }),
    );
  }

  async download(key: string, fileName: string, options?: DownloadOptions): Promise<Response> {
    const inline = options?.inline;
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        ...(inline
          ? { ResponseContentType: inline.contentType, ResponseCacheControl: `private, max-age=${inline.maxAgeSeconds}` }
          : { ResponseContentDisposition: attachmentDisposition(fileName) }),
      }),
      { expiresIn: inline ? Math.max(DOWNLOAD_URL_TTL_SECONDS, inline.maxAgeSeconds) : DOWNLOAD_URL_TTL_SECONDS },
    );
    // Redirect may be cached briefly for inline assets; it never outlives the signed URL.
    const cache = inline ? `private, max-age=${Math.min(inline.maxAgeSeconds, DOWNLOAD_URL_TTL_SECONDS)}` : "no-store";
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": cache } });
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }));
  }
}
