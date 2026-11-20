import { type NextRequest, NextResponse } from "next/server";
import type { AiThread } from "@/lib/ai-threads";
import {
  AiThreadError,
  importAiThreads,
  listAiThreads,
  parseStoredThread,
  saveAiThread,
} from "@/server/ai-threads";
import { currentUser } from "@/server/auth";

function failure(error: unknown) {
  if (error instanceof AiThreadError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "对话暂时存不下" }, { status: 503 });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  try {
    const threads = await listAiThreads(user.id);
    return NextResponse.json({ threads });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const body: unknown = await request.json().catch(() => null);
  const thread = parseStoredThread(body);
  if (!thread) {
    return NextResponse.json({ message: "对话格式不正确" }, { status: 400 });
  }
  try {
    await saveAiThread(user.id, thread);
    return NextResponse.json({
      id: thread.id,
      title: thread.title,
      updatedAt: thread.updatedAt,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const body: { threads?: unknown } = await request.json().catch(() => ({}));
  if (!Array.isArray(body.threads)) {
    return NextResponse.json({ message: "对话格式不正确" }, { status: 400 });
  }
  const threads: AiThread[] = [];
  for (const item of body.threads) {
    const thread = parseStoredThread(item);
    if (!thread) {
      return NextResponse.json({ message: "对话格式不正确" }, { status: 400 });
    }
    threads.push(thread);
  }
  try {
    await importAiThreads(user.id, threads);
    const saved = await listAiThreads(user.id);
    return NextResponse.json({ threads: saved });
  } catch (error) {
    return failure(error);
  }
}
