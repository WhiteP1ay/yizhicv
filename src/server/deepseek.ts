import "server-only";

import type { TokenUsage } from "@/server/ai-pricing";

const MODEL = "deepseek-chat";
const DEFAULT_BASE_URL = "https://api.deepseek.com";

export class DeepSeekRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function readPlatformKey() {
  const key = process.env.DEEPSEEK_API_KEY?.trim() ?? "";
  return key || null;
}

function readBaseUrl() {
  const raw = process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_BASE_URL;
  if (!raw.startsWith("https://")) return DEFAULT_BASE_URL;
  return raw.replace(/\/$/, "");
}

function redactSecrets(text: string) {
  return text.replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");
}

export async function completeChat(options: {
  apiKey: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens: number;
}) {
  const response = await fetch(`${readBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: options.messages,
      max_tokens: options.maxTokens,
      stream: false,
    }),
    signal: AbortSignal.timeout(60_000),
  });

  const payload: {
    error?: { message?: string };
    choices?: { message?: { content?: string | null } }[];
    usage?: TokenUsage;
  } | null = await response.json().catch(() => null);

  if (!response.ok) {
    const upstream = payload?.error?.message ?? "";
    throw new DeepSeekRequestError(
      redactSecrets(upstream).slice(0, 180) || "模型请求失败",
      response.status,
    );
  }

  const content = payload?.choices?.[0]?.message?.content ?? "";
  return {
    text: typeof content === "string" ? content : "",
    usage: payload?.usage ?? {},
  };
}
