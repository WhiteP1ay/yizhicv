export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_UPLOAD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type ImageUploadType = keyof typeof IMAGE_UPLOAD_TYPES;

export function isImageUploadType(value: string): value is ImageUploadType {
  return value in IMAGE_UPLOAD_TYPES;
}
