import {
  type AiProviderId,
  type ByokWire,
  parseInlineByok,
} from "@/lib/ai-providers";

const STORAGE_KEY = "yizhicv.ai-byok.v1";
export const BYOK_SYNC_FLAG = "yizhicv.ai-byok-sync";

export type LocalByok = {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl: string | null;
  wire: ByokWire | null;
};

export function readLocalByok(): LocalByok | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = parseInlineByok(JSON.parse(raw));
    if (!parsed || "error" in parsed) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalByok(value: LocalByok) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function clearLocalByok() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function syncLocalByok() {
  const local = readLocalByok();
  if (!local) {
    return { ok: false as const, status: 400, message: "请先保存到本地" };
  }
  try {
    const response = await fetch("/api/ai/byok", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: local.provider,
        model: local.model,
        apiKey: local.apiKey,
        ...(local.baseUrl && local.wire
          ? { baseUrl: local.baseUrl, wire: local.wire }
          : {}),
      }),
    });
    const payload: { message?: string } = await response
      .json()
      .catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false as const,
        status: response.status,
        message: payload.message ?? "同步失败",
      };
    }
    return { ok: true as const, status: 200 };
  } catch {
    return { ok: false as const, status: 0, message: "同步失败" };
  }
}
