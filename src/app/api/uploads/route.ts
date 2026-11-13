import { connection, type NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { isImageUploadType, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import { signImageUpload } from "@/lib/oss";

export async function POST(request: NextRequest) {
  await connection();
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

  const signed = signImageUpload(user.id, contentType);
  if (!signed) {
    return NextResponse.json({ message: "对象存储还没配好" }, { status: 500 });
  }

  return NextResponse.json(signed);
}
