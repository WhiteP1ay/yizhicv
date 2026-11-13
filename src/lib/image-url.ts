/** 文档和插槽只保存可访问的图片地址。 */
export function isRemoteImageUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function fileNameFromImageUrl(src: string): string {
  try {
    const name = new URL(src).pathname.split("/").pop() || "";
    return decodeURIComponent(name) || "image";
  } catch {
    return "image";
  }
}
