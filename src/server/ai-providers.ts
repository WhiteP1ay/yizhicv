import "server-only";

import type { AiProviderId } from "@/lib/ai-providers";

type OpenAIWire = {
  wire: "openai";
  url: string;
  modelsUrl: string;
  tokenParam: "max_tokens" | "max_completion_tokens";
};

type AnthropicWire = {
  wire: "anthropic";
  url: string;
  modelsUrl: string;
  anthropicVersion: string;
};

export type ProviderEndpoint = OpenAIWire | AnthropicWire;

/**
 * 官方地址。这些服务商用 API key 就能调通。
 * 模型 id 不写死，用同一把 key 调 modelsUrl 现拉。
 */
const ENDPOINTS: Record<AiProviderId, ProviderEndpoint> = {
  openai: {
    wire: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    modelsUrl: "https://api.openai.com/v1/models",
    tokenParam: "max_completion_tokens",
  },
  anthropic: {
    wire: "anthropic",
    url: "https://api.anthropic.com/v1/messages",
    modelsUrl: "https://api.anthropic.com/v1/models",
    anthropicVersion: "2026-10-21",
  },
  google: {
    wire: "openai",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    modelsUrl: "https://generativelanguage.googleapis.com/v1beta/openai/models",
    tokenParam: "max_tokens",
  },
  deepseek: {
    wire: "openai",
    url: "https://api.deepseek.com/chat/completions",
    modelsUrl: "https://api.deepseek.com/models",
    tokenParam: "max_tokens",
  },
  groq: {
    wire: "openai",
    url: "https://api.groq.com/openai/v1/chat/completions",
    modelsUrl: "https://api.groq.com/openai/v1/models",
    tokenParam: "max_tokens",
  },
  bailian: {
    wire: "openai",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelsUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/models",
    tokenParam: "max_tokens",
  },
  siliconflow: {
    wire: "openai",
    url: "https://api.siliconflow.cn/v1/chat/completions",
    modelsUrl: "https://api.siliconflow.cn/v1/models?sub_type=chat",
    tokenParam: "max_tokens",
  },
  openrouter: {
    wire: "openai",
    url: "https://openrouter.ai/api/v1/chat/completions",
    modelsUrl: "https://openrouter.ai/api/v1/models",
    tokenParam: "max_tokens",
  },
};

export function resolveProviderEndpoint(id: AiProviderId): ProviderEndpoint {
  return ENDPOINTS[id];
}
