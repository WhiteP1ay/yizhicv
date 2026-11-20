export const AI_PROVIDERS = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "groq", label: "Groq" },
  { id: "bailian", label: "阿里百炼" },
  { id: "siliconflow", label: "硅基流动" },
  { id: "openrouter", label: "OpenRouter" },
] as const;

export type AiProviderId = (typeof AI_PROVIDERS)[number]["id"];

export function isAiProviderId(value: unknown): value is AiProviderId {
  return AI_PROVIDERS.some((item) => item.id === value);
}

/** 空字符串表示没填。格式不对返回 null。 */
export function parseByokApiKey(value: unknown) {
  if (typeof value !== "string") return "";
  const key = value.trim();
  if (!key) return "";
  if (key.length < 8 || key.length > 512 || /[\r\n]/.test(key)) return null;
  return key;
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
  };
  if (!isAiProviderId(row.provider)) {
    return { error: "请选择服务商" as const };
  }
  const model = parseByokModel(row.model);
  if (!model) return { error: "请先获取并选择模型" as const };
  const apiKey = parseByokApiKey(row.apiKey);
  if (!apiKey) return { error: "请填写 API key" as const };
  return {
    provider: row.provider,
    model,
    apiKey,
  };
}
