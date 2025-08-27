declare module "@vercel/blob" {
  export function put(key: string, body: any, opts?: any): Promise<{ url: string }>;
  export function head(key: string): Promise<{ url?: string } | null>;
}
