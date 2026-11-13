import OSS from "ali-oss";
import { nanoid } from "nanoid";
import { IMAGE_UPLOAD_TYPES, type ImageUploadType } from "@/lib/image-upload";

const SIGNED_URL_SECONDS = 300;

function envValue(name: string) {
  const value = process.env[name]?.trim() ?? "";
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function readOssConfig() {
  const region = envValue("OSS_REGION");
  const bucket = envValue("OSS_BUCKET");
  const accessKeyId = envValue("OSS_ACCESS_KEY_ID");
  const accessKeySecret = envValue("OSS_ACCESS_KEY_SECRET");
  const publicBase = envValue("OSS_PUBLIC_BASE_URL").replace(/\/$/, "");
  if (!region || !bucket || !accessKeyId || !accessKeySecret || !publicBase) {
    return null;
  }
  return {
    region: region.startsWith("oss-") ? region : `oss-${region}`,
    bucket,
    accessKeyId,
    accessKeySecret,
    publicBase,
  };
}

export function signImageUpload(userId: string, contentType: ImageUploadType) {
  const config = readOssConfig();
  if (!config) return null;

  const key = `users/${userId}/${nanoid()}.${IMAGE_UPLOAD_TYPES[contentType]}`;
  const client = new OSS({
    region: config.region,
    bucket: config.bucket,
    accessKeyId: config.accessKeyId,
    accessKeySecret: config.accessKeySecret,
    secure: true,
  });
  const uploadUrl = client.signatureUrl(key, {
    method: "PUT",
    expires: SIGNED_URL_SECONDS,
    "Content-Type": contentType,
  });

  return {
    uploadUrl,
    publicUrl: `${config.publicBase}/${key}`,
    contentType,
  };
}
