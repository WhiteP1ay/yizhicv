import "server-only";

import {
  type AiProviderId,
  type ByokWire,
  parseByokModel,
} from "@/lib/ai-providers";
import {
  ByokEndpointError,
  resolveProviderEndpoint,
} from "@/server/ai-providers";

export class ProviderModelsError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type ModelsPayload = {
  data?: { id?: unknown }[];
  models?: { name?: unknown }[];
  has_more?: unknown;
  last_id?: unknown;
  nextPageToken?: unknown;
};

function normalizeId(value: unknown) {
  if (typeof value !== "string") return "";
  return parseByokModel(value.replace(/^models\//, "")) ?? "";
}

function idsFrom(payload: ModelsPayload | null) {
  const ids: string[] = [];
  for (const item of payload?.data ?? []) ids.push(normalizeId(item.id));
  for (const item of payload?.models ?? []) ids.push(normalizeId(item.name));
  return ids.filter(Boolean);
}

function nextPage(current: string, payload: ModelsPayload | null) {
  const url = new URL(current);
  if (payload?.has_more === true && typeof payload.last_id === "string") {
    url.searchParams.set("limit", "100");
    url.searchParams.set("after_id", payload.last_id);
    return url.toString();
  }
  if (typeof payload?.nextPageToken === "string" && payload.nextPageToken) {
    url.searchParams.set("pageToken", payload.nextPageToken);
    return url.toString();
  }
  return null;
}

function upstreamFailure(status: number): never {
  if (status === 401 || status === 403) {
    throw new ProviderModelsError("API key 无效", 400);
  }
  throw new ProviderModelsError("暂时拉不到模型列表", 502);
}

export async function listProviderModels(
  provider: AiProviderId,
  apiKey: string,
  custom?: { baseUrl?: string | null; wire?: ByokWire | null },
) {
  const endpoint = await resolveProviderEndpoint(provider, custom);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (endpoint.wire === "anthropic") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const ids = new Set<string>();
  const seen = new Set<string>();
  let url: string | null = endpoint.modelsUrl;

  try {
    for (let page = 0; page < 8 && url; page++) {
      if (seen.has(url)) break;
      seen.add(url);
      const response = await fetch(url, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(20_000),
      });
      const payload = (await response
        .json()
        .catch(() => null)) as ModelsPayload | null;
      if (!response.ok) upstreamFailure(response.status);
      for (const id of idsFrom(payload)) ids.add(id);
      url = nextPage(url, payload);
    }
  } catch (error) {
    if (
      error instanceof ProviderModelsError ||
      error instanceof ByokEndpointError
    ) {
      throw error;
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new ProviderModelsError("获取模型超时", 504);
    }
    throw new ProviderModelsError("暂时拉不到模型列表", 502);
  }

  const models = [...ids].sort((a, b) => a.localeCompare(b));
  if (models.length === 0) {
    throw new ProviderModelsError("这个 key 没有可用模型", 400);
  }
  return models;
}
