import { type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { readAiThread } from "@/server/ai-threads";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const thread = await readAiThread(user.id, id);
    if (!thread) {
      return NextResponse.json({ message: "找不到这段对话" }, { status: 404 });
    }
    return NextResponse.json(thread);
  } catch {
    return NextResponse.json({ message: "对话暂时读不出来" }, { status: 503 });
  }
}
