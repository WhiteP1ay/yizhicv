import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isImageUploadType, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import { deleteUserImageByUrl, reserveUserImage } from "@/lib/user-images";

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body: { contentType?: unknown; size?: unknown } = await request
    .json()
    .catch(() => ({}));
  const contentType =
    typeof body.contentType === "string" ? body.contentType : "";
  const size = typeof body.size === "number" ? body.size : 0;

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

  const reserved = await reserveUserImage(user.id, contentType, size);
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
