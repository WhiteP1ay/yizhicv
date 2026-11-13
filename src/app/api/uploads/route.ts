import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isImageUploadType, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import { currentUser } from "@/server/auth";
import {
  deleteUserImageByUrl,
  listUserImages,
  reserveUserImage,
} from "@/server/user-images";

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body: { contentType?: unknown; size?: unknown; name?: unknown } =
    await request.json().catch(() => ({}));
  const contentType =
    typeof body.contentType === "string" ? body.contentType : "";
  const size = typeof body.size === "number" ? body.size : 0;
  const name = typeof body.name === "string" ? body.name : "";

  if (!isImageUploadType(contentType)) {
    return NextResponse.json(
      { message: "只支持 jpg、png、webp" },
      { status: 400 },
    );
  }
  if (!Number.isInteger(size) || size <= 0 || size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json(
      { message: "单张图片不能超过 5MB" },
      { status: 400 },
    );
  }

  const reserved = await reserveUserImage(user.id, contentType, size, name);
  if (!reserved.ok) {
    return NextResponse.json(
      { message: reserved.message },
      { status: reserved.status },
    );
  }

  return NextResponse.json({
    imageId: reserved.id,
    uploadUrl: reserved.uploadUrl,
    publicUrl: reserved.publicUrl,
  });
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body: { src?: unknown } = await request.json().catch(() => ({}));
  const src = typeof body.src === "string" ? body.src : "";
  if (!src) {
    return NextResponse.json({ message: "缺少图片地址" }, { status: 400 });
  }

  const removed = await deleteUserImageByUrl(user.id, src);
  if (!removed.ok) {
    return NextResponse.json(
      { message: removed.message },
      { status: removed.status },
    );
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const images = await listUserImages(user.id, query);
  return NextResponse.json({ images });
}
