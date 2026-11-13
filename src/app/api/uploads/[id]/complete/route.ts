import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { completeUserImage } from "@/server/user-images";

const imageIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  if (!imageIdPattern.test(id)) {
    return NextResponse.json({ message: "上传记录不存在" }, { status: 404 });
  }

  const completed = await completeUserImage(user.id, id);
  if (!completed.ok) {
    return NextResponse.json(
      { message: completed.message },
      { status: completed.status },
    );
  }
  return NextResponse.json({ publicUrl: completed.publicUrl });
}
