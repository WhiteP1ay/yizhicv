import { and, eq, lt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, userImages, users } from "@/db";
import { IMAGE_UPLOAD_TYPES, type ImageUploadType } from "@/lib/image-upload";
import {
  deleteStoredObject,
  objectKeyFromPublicUrl,
  publicUrlFor,
  signStoredUpload,
} from "@/lib/oss";

export const USER_IMAGE_QUOTA_BYTES = 30 * 1024 * 1024;
export const UPLOAD_URL_SECONDS = 300;

const QUOTA_MESSAGE = "未付费用户一共只能上传 30MB";

async function deleteObjects(objectKeys: string[]) {
  await Promise.all(
    objectKeys.map((objectKey) => deleteStoredObject(objectKey)),
  );
}

export async function reserveUserImage(
  userId: string,
  contentType: ImageUploadType,
  byteSize: number,
) {
  const expiredKeys: string[] = [];
  const reserved = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select ${users.id} from ${users} where ${users.id} = ${userId} for update`,
    );
    const expired = await tx
      .delete(userImages)
      .where(
        and(
          eq(userImages.userId, userId),
          eq(userImages.status, "pending"),
          lt(
            userImages.createdAt,
            new Date(Date.now() - UPLOAD_URL_SECONDS * 1000),
          ),
        ),
      )
      .returning({ objectKey: userImages.objectKey });
    expiredKeys.push(...expired.map((row) => row.objectKey));

    const [sumRow] = await tx
      .select({
        total: sql<string>`coalesce(sum(${userImages.byteSize}), 0)`,
      })
      .from(userImages)
      .where(eq(userImages.userId, userId));
    const used = Number(sumRow?.total ?? 0);
    if (!Number.isFinite(used) || used + byteSize > USER_IMAGE_QUOTA_BYTES) {
      return null;
    }

    const objectKey = `users/${userId}/${nanoid()}.${IMAGE_UPLOAD_TYPES[contentType]}`;
    const [row] = await tx
      .insert(userImages)
      .values({
        userId,
        objectKey,
        byteSize,
        contentType,
        status: "pending",
      })
      .returning({ id: userImages.id, objectKey: userImages.objectKey });
    return row ?? null;
  });

  await deleteObjects(expiredKeys);
  if (!reserved) {
    return { ok: false as const, status: 403, message: QUOTA_MESSAGE };
  }

  const signed = await signStoredUpload({
    objectKey: reserved.objectKey,
    contentType,
    byteSize,
    expires: UPLOAD_URL_SECONDS,
  });
  if (!signed) {
    await db
      .delete(userImages)
      .where(
        and(eq(userImages.id, reserved.id), eq(userImages.userId, userId)),
      );
    return { ok: false as const, status: 500, message: "对象存储还没配好" };
  }

  return {
    ok: true as const,
    id: reserved.id,
    uploadUrl: signed.uploadUrl,
    publicUrl: signed.publicUrl,
  };
}

// TODO(线上): 改成阿里云 OSS 上传回调。PUT 成功后由 OSS 通知服务端把 pending 改成 ready，浏览器不再调用 complete。本地 localhost 收不到回调，所以现在仍由前端通知。
export async function completeUserImage(userId: string, imageId: string) {
  const [row] = await db
    .select()
    .from(userImages)
    .where(and(eq(userImages.id, imageId), eq(userImages.userId, userId)))
    .limit(1);
  if (!row)
    return { ok: false as const, status: 404, message: "上传记录不存在" };

  const publicUrl = publicUrlFor(row.objectKey);
  if (!publicUrl) {
    return { ok: false as const, status: 500, message: "对象存储还没配好" };
  }
  if (row.status === "ready") return { ok: true as const, publicUrl };

  const expired =
    row.createdAt.getTime() + UPLOAD_URL_SECONDS * 1000 < Date.now();
  if (expired) {
    await db
      .delete(userImages)
      .where(and(eq(userImages.id, row.id), eq(userImages.userId, userId)));
    await deleteStoredObject(row.objectKey);
    return {
      ok: false as const,
      status: 409,
      message: "上传已过期，请重新选择",
    };
  }

  await db
    .update(userImages)
    .set({ status: "ready" })
    .where(and(eq(userImages.id, row.id), eq(userImages.userId, userId)));
  return { ok: true as const, publicUrl };
}

export async function deleteUserImageByUrl(userId: string, src: string) {
  const objectKey = objectKeyFromPublicUrl(src);
  if (!objectKey?.startsWith(`users/${userId}/`)) {
    return { ok: false as const, status: 404, message: "找不到这张图片" };
  }

  const [row] = await db
    .select()
    .from(userImages)
    .where(
      and(eq(userImages.userId, userId), eq(userImages.objectKey, objectKey)),
    )
    .limit(1);
  if (!row)
    return { ok: false as const, status: 404, message: "找不到这张图片" };

  const removed = await deleteStoredObject(row.objectKey);
  if (!removed) {
    return {
      ok: false as const,
      status: 502,
      message: "图片没有从存储里删掉",
    };
  }

  await db
    .delete(userImages)
    .where(and(eq(userImages.id, row.id), eq(userImages.userId, userId)));
  return { ok: true as const };
}
