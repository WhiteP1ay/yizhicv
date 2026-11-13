import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUser } from "@/server/auth";
import { renameUserImage } from "@/server/user-images";

const imageIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const { id } = await params;
  if (!imageIdPattern.test(id)) {
    return NextResponse.json({ message: "找不到这张图片" }, { status: 404 });
  }

  const body: { name?: unknown } = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";
  const renamed = await renameUserImage(user.id, id, name);
  if (!renamed.ok) {
    return NextResponse.json(
      { message: renamed.message },
      { status: renamed.status },
    );
  }
  return NextResponse.json({ name: renamed.name });
}
