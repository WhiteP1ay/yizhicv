import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  return NextResponse.json({ user });
}
