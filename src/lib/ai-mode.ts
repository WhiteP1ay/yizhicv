const STORAGE_KEY = "yizhicv.ai-chat-mode";

export type AiChatMode = "platform" | "byok";

export function readAiMode(): AiChatMode | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "platform" || value === "byok" ? value : null;
  } catch {
    return null;
  }
}

export function writeAiMode(mode: AiChatMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
}
