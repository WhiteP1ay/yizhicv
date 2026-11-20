import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import {
  type AiProviderId,
  type ByokWire,
  parseByokBaseUrl,
} from "@/lib/ai-providers";

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

export class ByokEndpointError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ByokEndpointError";
    this.status = status;
  }
}

/**
 * 官方默认地址。这些服务商用 API key 就能调通，不向用户要 base URL。
 * 模型 id 不写死，用同一把 key 调 modelsUrl 现拉。
 * 自定义服务商除外：根地址和接口格式由用户填写。
 */
const ENDPOINTS: Record<Exclude<AiProviderId, "custom">, ProviderEndpoint> = {
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
  openrouter: {
    wire: "openai",
    url: "https://openrouter.ai/api/v1/chat/completions",
    modelsUrl: "https://openrouter.ai/api/v1/models",
    tokenParam: "max_tokens",
  },
};

function isLocalHost(hostname: string) {
  return (
    hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
  );
}

function isBlockedAddress(address: string) {
  const ip = address.toLowerCase();
  const mapped = ip.startsWith("::ffff:") ? ip.slice("::ffff:".length) : ip;
  const version = isIP(mapped);
  if (version === 4) {
    const parts = mapped.split(".").map(Number);
    if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
      return true;
    }
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (version === 6) {
    if (mapped === "::1" || mapped === "::") return true;
    if (mapped.startsWith("fc") || mapped.startsWith("fd")) return true;
    if (mapped.startsWith("fe80") || mapped.startsWith("ff")) return true;
    return false;
  }
  return true;
}

async function assertPublicBaseUrl(base: string) {
  const hostname = new URL(base).hostname.toLowerCase();
  if (isLocalHost(hostname)) return;
  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new ByokEndpointError("base URL 不可用");
    }
    return;
  }
  let records: { address: string }[];
  try {
    records = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ByokEndpointError("base URL 无法解析");
  }
  if (
    records.length === 0 ||
    records.some((record) => isBlockedAddress(record.address))
  ) {
    throw new ByokEndpointError("base URL 不可用");
  }
}

export async function resolveProviderEndpoint(
  id: AiProviderId,
  custom?: { baseUrl?: string | null; wire?: ByokWire | null },
): Promise<ProviderEndpoint> {
  if (id !== "custom") return ENDPOINTS[id];
  const base = parseByokBaseUrl(custom?.baseUrl);
  if (base === "") throw new ByokEndpointError("请填写 base URL");
  if (!base) throw new ByokEndpointError("base URL 格式不正确");
  if (custom?.wire !== "openai" && custom?.wire !== "anthropic") {
    throw new ByokEndpointError("请选择接口格式");
  }
  await assertPublicBaseUrl(base);
  if (custom.wire === "anthropic") {
    return {
      wire: "anthropic",
      url: `${base}/messages`,
      modelsUrl: `${base}/models`,
      anthropicVersion: "2023-06-01",
    };
  }
  return {
    wire: "openai",
    url: `${base}/chat/completions`,
    modelsUrl: `${base}/models`,
    tokenParam: "max_tokens",
  };
}
