import { type NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  deleteSession,
  readSessionToken,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = readSessionToken(request);
  if (token) {
    await deleteSession(token);
  }
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
