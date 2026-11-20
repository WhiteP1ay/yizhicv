export const AI_PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "groq", label: "Groq" },
  { id: "bailian", label: "阿里百炼" },
  { id: "openrouter", label: "OpenRouter" },
  { id: "custom", label: "自定义" },
] as const;

export const BYOK_WIRES = ["openai", "anthropic"] as const;

export type ByokWire = (typeof BYOK_WIRES)[number];

export type AiProviderId = (typeof AI_PROVIDERS)[number]["id"];

export function isAiProviderId(value: unknown): value is AiProviderId {
  return AI_PROVIDERS.some((item) => item.id === value);
}

export function isByokWire(value: unknown): value is ByokWire {
  return value === "openai" || value === "anthropic";
}

/** 空字符串表示没填。格式不对返回 null。 */
export function parseByokApiKey(value: unknown) {
  if (typeof value !== "string") return "";
  const key = value.trim();
  if (!key) return "";
  if (key.length < 8 || key.length > 512 || /[\r\n]/.test(key)) return null;
  return key;
}

/**
 * 空字符串表示没填。格式不对返回 null。
 * 接受 OpenAI 兼容根地址，例如 https://example.com/v1。
 * 本机 http://localhost 也可以。
 */
export function parseByokBaseUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const raw = value.trim();
  if (!raw) return "";
  if (raw.length > 300 || /\s/.test(raw)) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.username || url.password || url.search || url.hash) return null;
  const host = url.hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    return null;
  }
  if (!local && !host.includes(".")) return null;
  const path = url.pathname
    .replace(/\/+$/, "")
    .replace(/\/(chat\/completions|messages|models)$/, "");
  const port = url.port ? `:${url.port}` : "";
  const hostname = host.includes(":") ? `[${host}]` : host;
  return `${url.protocol}//${hostname}${port}${path}`;
}

export function parseByokCustom(
  provider: AiProviderId,
  baseUrl: unknown,
  wire: unknown,
) {
  if (provider !== "custom") return null;
  const parsed = parseByokBaseUrl(baseUrl);
  if (parsed === "") return { error: "请填写 base URL" as const };
  if (!parsed) return { error: "base URL 格式不正确" as const };
  if (!isByokWire(wire)) return { error: "请选择接口格式" as const };
  return { baseUrl: parsed, wire };
}

export function parseByokModel(value: unknown) {
  if (typeof value !== "string") return null;
  const model = value.trim();
  if (!model || model.length > 200 || /\s/.test(model)) return null;
  return model;
}

/** 没有 byok 字段时返回 null。字段在，但格式不对，返回 error。 */
export function parseInlineByok(value: unknown) {
  if (value == null) return null;
  if (!value || typeof value !== "object") {
    return { error: "请先配置 API key" as const };
  }
  const row = value as {
    provider?: unknown;
    model?: unknown;
    apiKey?: unknown;
    baseUrl?: unknown;
    wire?: unknown;
  };
  if (!isAiProviderId(row.provider)) {
    return { error: "请选择服务商" as const };
  }
  const model = parseByokModel(row.model);
  if (!model) return { error: "请先获取并选择模型" as const };
  const apiKey = parseByokApiKey(row.apiKey);
  if (!apiKey) return { error: "请填写 API key" as const };
  const custom = parseByokCustom(row.provider, row.baseUrl, row.wire);
  if (custom && "error" in custom) return { error: custom.error };
  return {
    provider: row.provider,
    model,
    apiKey,
    baseUrl: custom?.baseUrl ?? null,
    wire: custom?.wire ?? null,
  };
}
