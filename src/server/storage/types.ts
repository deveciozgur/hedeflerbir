export interface DownloadOptions {
  /** Serve for display (e.g. avatars) instead of as an attachment. */
  inline?: { contentType: string; maxAgeSeconds: number };
}

/** Storage port — application code depends on this, never on a concrete provider. */
export interface FileStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  /** Returns either the file stream or a short-lived redirect to the provider. */
  download(key: string, fileName: string, options?: DownloadOptions): Promise<Response>;
  delete(key: string): Promise<void>;
}

export const attachmentDisposition = (fileName: string) =>
  `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`;
