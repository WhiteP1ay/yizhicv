import { type NextRequest, NextResponse } from "next/server";
import { ensureAiAccount } from "@/server/ai-ledger";
import { currentUser } from "@/server/auth";

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  try {
    const balance = await ensureAiAccount(user.id);
    return NextResponse.json({ balancePicoCny: balance.toString() });
  } catch {
    return NextResponse.json({ message: "余额暂时不可用" }, { status: 503 });
  }
}
