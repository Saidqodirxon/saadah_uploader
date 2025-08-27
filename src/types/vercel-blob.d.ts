declare module "@vercel/blob" {
  export type PutOptions = {
    access?: "public" | "private";
    addRandomSuffix?: boolean;
    contentType?: string;
  };

  // body can be a File, Blob, string (for JSON), ArrayBuffer, or ReadableStream
  export function put(
    key: string,
    body: File | Blob | string | ArrayBuffer | ReadableStream<unknown>,
    opts?: PutOptions
  ): Promise<{ url: string }>;

  export function head(key: string): Promise<{ url?: string } | null>;
}
