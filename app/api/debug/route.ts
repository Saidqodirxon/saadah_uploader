import { NextResponse } from "next/server";

export async function GET() {
  // Do NOT return the token value. Only indicate presence to avoid leaking secrets.
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  return NextResponse.json({ ok: true, hasToken });
}
