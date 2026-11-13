import "server-only";
import OSS from "ali-oss";

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

function createClient() {
  const config = readOssConfig();
  if (!config) return null;
  return {
    config,
    client: new OSS({
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      secure: true,
    }),
  };
}

export function publicUrlFor(objectKey: string) {
  const config = readOssConfig();
  if (!config) return null;
  return `${config.publicBase}/${objectKey}`;
}

export function objectKeyFromPublicUrl(src: string) {
  const config = readOssConfig();
  if (!config) return null;
  let url: URL;
  let base: URL;
  try {
    url = new URL(src);
    base = new URL(config.publicBase);
  } catch {
    return null;
  }
  if (url.origin !== base.origin) return null;
  const basePath = base.pathname.replace(/\/$/, "");
  const path = decodeURIComponent(url.pathname);
  const prefix = `${basePath}/`;
  if (!path.startsWith(prefix)) return null;
  const key = path.slice(prefix.length);
  if (!key || key.split("/").includes("..")) return null;
  return key;
}

export async function signStoredUpload(input: {
  objectKey: string;
  contentType: string;
  byteSize: number;
  expires: number;
}) {
  const oss = createClient();
  if (!oss) return null;
  const uploadUrl = await oss.client.signatureUrlV4(
    "PUT",
    input.expires,
    {
      headers: {
        "content-type": input.contentType,
        "content-length": String(input.byteSize),
      },
    },
    input.objectKey,
    ["content-length"],
  );
  return {
    uploadUrl,
    publicUrl: `${oss.config.publicBase}/${input.objectKey}`,
  };
}

export async function deleteStoredObject(objectKey: string) {
  const oss = createClient();
  if (!oss) return false;
  try {
    await oss.client.delete(objectKey);
    return true;
  } catch (error) {
    const status =
      error && typeof error === "object" && "status" in error
        ? error.status
        : undefined;
    const code =
      error && typeof error === "object" && "code" in error
        ? error.code
        : undefined;
    return status === 404 || code === "NoSuchKey";
  }
}
