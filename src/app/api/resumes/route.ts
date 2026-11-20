import { type NextRequest, NextResponse } from "next/server";
import { parseResumeDocument } from "@/lib/resume-document";
import { currentUser } from "@/server/auth";
import { importResumes, listResumes, ResumeError } from "@/server/resumes";
import type { YizhiResume } from "@/types/resume";

function failure(error: unknown) {
  if (error instanceof ResumeError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "简历暂时读不出来" }, { status: 503 });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  try {
    const resumes = await listResumes(user.id);
    return NextResponse.json({ resumes });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const body: { resumes?: unknown } = await request.json().catch(() => ({}));
  if (!Array.isArray(body.resumes)) {
    return NextResponse.json({ message: "简历格式不正确" }, { status: 400 });
  }
  const resumes: YizhiResume[] = [];
  for (const item of body.resumes) {
    const resume = parseResumeDocument(item);
    if (!resume) {
      return NextResponse.json({ message: "简历格式不正确" }, { status: 400 });
    }
    resumes.push(resume);
  }
  try {
    await importResumes(user.id, resumes);
    return NextResponse.json({ resumes: await listResumes(user.id) });
  } catch (error) {
    return failure(error);
  }
}
