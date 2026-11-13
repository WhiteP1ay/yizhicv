export const SIDE_LAYOUT_MIN = 20;
export const SIDE_LAYOUT_MAX = 80;
export const SIDE_LAYOUT_DEFAULT = 50;

export function clampSideLayoutLeft(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return SIDE_LAYOUT_DEFAULT;
  return Math.min(SIDE_LAYOUT_MAX, Math.max(SIDE_LAYOUT_MIN, Math.round(n)));
}
