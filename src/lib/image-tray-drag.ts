export const IMAGE_TRAY_DRAG_TYPE = "application/x-yizhicv-image";

export type ImageTrayDragPayload = {
  src: string;
  name: string;
  stored: boolean;
};

export function readImageTrayDrag(
  dataTransfer: DataTransfer | null,
): ImageTrayDragPayload | null {
  const raw = dataTransfer?.getData(IMAGE_TRAY_DRAG_TYPE);
  if (!raw) return null;
  try {
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object") return null;
    const src = "src" in payload ? payload.src : "";
    const name = "name" in payload ? payload.name : "";
    const stored = "stored" in payload ? payload.stored : false;
    if (typeof src !== "string" || !src) return null;
    return {
      src,
      name: typeof name === "string" ? name : "",
      stored: stored === true,
    };
  } catch {
    return null;
  }
}
