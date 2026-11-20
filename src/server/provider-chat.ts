import "server-only";

import type { AiProviderId, ByokWire } from "@/lib/ai-providers";
import { resolveProviderEndpoint } from "@/server/ai-providers";

type ChatTurn = { role: "user" | "assistant"; content: string };

export class ProviderRequestError extends Error {
  status: number;

  constructor(status: number) {
    super("模型请求失败");
    this.status = status;
  }
}

function alternateRoles(messages: ChatTurn[]) {
  const merged: ChatTurn[] = [];
  for (const message of messages) {
    const last = merged[merged.length - 1];
    if (last && last.role === message.role) {
      last.content = `${last.content}\n\n${message.content}`;
    } else {
      merged.push({ role: message.role, content: message.content });
    }
  }
  return merged;
}

async function readPayload(response: Response) {
  return (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string | null } }[];
    content?: { type?: string; text?: string }[];
  } | null;
}

export async function completeByokChat(options: {
  provider: AiProviderId;
  model: string;
  apiKey: string;
  baseUrl?: string | null;
  wire?: ByokWire | null;
  messages: ChatTurn[];
  maxTokens: number;
}) {
  const endpoint = await resolveProviderEndpoint(options.provider, {
    baseUrl: options.baseUrl,
    wire: options.wire,
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  let body: Record<string, unknown>;

  if (endpoint.wire === "anthropic") {
    headers["x-api-key"] = options.apiKey;
    headers["anthropic-version"] = endpoint.anthropicVersion;
    body = {
      model: options.model,
      max_tokens: options.maxTokens,
      messages: alternateRoles(options.messages),
    };
  } else {
    headers.Authorization = `Bearer ${options.apiKey}`;
    body = {
      model: options.model,
      messages: options.messages,
      [endpoint.tokenParam]: options.maxTokens,
      stream: false,
    };
  }

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    throw new ProviderRequestError(response.status);
  }

  if (endpoint.wire === "anthropic") {
    const parts: string[] = [];
    for (const block of payload?.content ?? []) {
      if (block.type === "text" && typeof block.text === "string") {
        parts.push(block.text);
      }
    }
    return { text: parts.join("") };
  }

  const content = payload?.choices?.[0]?.message?.content ?? "";
  return { text: typeof content === "string" ? content : "" };
}
