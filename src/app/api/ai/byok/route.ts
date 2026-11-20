import { type NextRequest, NextResponse } from "next/server";
import {
  isAiProviderId,
  parseByokApiKey,
  parseByokCustom,
  parseByokModel,
} from "@/lib/ai-providers";
import {
  ByokEndpointError,
  resolveProviderEndpoint,
} from "@/server/ai-providers";
import { currentUser } from "@/server/auth";
import {
  ByokStoreError,
  clearByokSecret,
  readByokSecret,
  readByokStatus,
  writeByokSecret,
} from "@/server/byok-store";
import {
  listProviderModels,
  ProviderModelsError,
} from "@/server/provider-models";

function storeFailure(error: unknown) {
  if (error instanceof ByokStoreError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "密钥存储未就绪" }, { status: 503 });
}

function modelsFailure(error: unknown) {
  if (
    error instanceof ProviderModelsError ||
    error instanceof ByokEndpointError
  ) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return NextResponse.json({ message: "获取模型超时" }, { status: 504 });
  }
  return NextResponse.json({ message: "暂时拉不到模型列表" }, { status: 502 });
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  try {
    const status = await readByokStatus(user.id);
    return NextResponse.json(status);
  } catch (error) {
    return storeFailure(error);
  }
}

export async function PUT(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }

  const body: {
    provider?: unknown;
    apiKey?: unknown;
    model?: unknown;
    baseUrl?: unknown;
    wire?: unknown;
  } = await request.json().catch(() => ({}));
  if (!isAiProviderId(body.provider)) {
    return NextResponse.json({ message: "请选择服务商" }, { status: 400 });
  }
  const custom = parseByokCustom(body.provider, body.baseUrl, body.wire);
  if (custom && "error" in custom) {
    return NextResponse.json({ message: custom.error }, { status: 400 });
  }
  const model = parseByokModel(body.model);
  if (!model) {
    return NextResponse.json(
      { message: body.provider === "custom" ? "请填写模型" : "请选择模型" },
      { status: 400 },
    );
  }
  const submitted = parseByokApiKey(body.apiKey);
  if (submitted === null) {
    return NextResponse.json({ message: "请填写 API key" }, { status: 400 });
  }

  try {
    let apiKey = submitted;
    if (!apiKey) {
      const existing = await readByokSecret(user.id);
      if (!existing || existing.provider !== body.provider) {
        return NextResponse.json(
          { message: "请填写 API key" },
          { status: 400 },
        );
      }
      apiKey = existing.apiKey;
    }
    await resolveProviderEndpoint(body.provider, custom ?? undefined);
    if (!custom) {
      const models = await listProviderModels(body.provider, apiKey);
      if (!models.includes(model)) {
        return NextResponse.json(
          { message: "这个模型当前不可用，请重新获取" },
          { status: 400 },
        );
      }
    }
    await writeByokSecret(user.id, body.provider, apiKey, model, custom);
    return NextResponse.json({
      provider: body.provider,
      model,
      baseUrl: custom?.baseUrl ?? null,
      wire: custom?.wire ?? null,
      configured: true,
    });
  } catch (error) {
    if (
      error instanceof ProviderModelsError ||
      error instanceof ByokEndpointError
    ) {
      return modelsFailure(error);
    }
    return storeFailure(error);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) {
    return NextResponse.json({ message: "请先登录" }, { status: 401 });
  }
  try {
    await clearByokSecret(user.id);
    return NextResponse.json({ provider: null, configured: false });
  } catch (error) {
    return storeFailure(error);
  }
}
