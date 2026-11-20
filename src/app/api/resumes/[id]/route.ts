import { type NextRequest, NextResponse } from "next/server";
import { parseResumeDocument } from "@/lib/resume-document";
import { currentUser } from "@/server/auth";
import {
  ResumeError,
  readResume,
  removeResume,
  saveResume,
} from "@/server/resumes";

function failure(error: unknown, fallback: string) {
  if (error instanceof ResumeError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: fallback }, { status: 503 });
}

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
    const resume = await readResume(user.id, id);
    if (!resume) {
      return NextResponse.json({ message: "找不到这份简历" }, { status: 404 });
    }
    return NextResponse.json({ resume });
  } catch (error) {
    return failure(error, "这份简历读不出来");
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  const body: { resume?: unknown } = await request.json().catch(() => ({}));
  const resume = parseResumeDocument(body.resume);
  if (!resume || resume.metadata.id !== id) {
    return NextResponse.json({ message: "简历格式不正确" }, { status: 400 });
  }
  try {
    await saveResume(user.id, resume);
    return NextResponse.json({
      id: resume.metadata.id,
      title: resume.metadata.title,
      updatedAt: resume.metadata.updatedAt,
    });
  } catch (error) {
    return failure(error, "简历暂时存不下");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const { id } = await params;
  try {
    await removeResume(user.id, id);
    return NextResponse.json({ id });
  } catch (error) {
    return failure(error, "这份简历删不掉");
  }
}
