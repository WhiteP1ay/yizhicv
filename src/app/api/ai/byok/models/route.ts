import { type NextRequest, NextResponse } from "next/server";
import { isAiProviderId, parseByokApiKey } from "@/lib/ai-providers";
import { currentUser } from "@/server/auth";
import { ByokStoreError, readByokSecret } from "@/server/byok-store";
import {
  listProviderModels,
  ProviderModelsError,
} from "@/server/provider-models";

function failure(error: unknown) {
  if (error instanceof ByokStoreError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  if (error instanceof ProviderModelsError) {
    return NextResponse.json(
      { message: error.message },
      { status: error.status },
    );
  }
  return NextResponse.json({ message: "暂时拉不到模型列表" }, { status: 502 });
}

export async function POST(request: NextRequest) {
  const body: {
    provider?: unknown;
    apiKey?: unknown;
  } = await request.json().catch(() => ({}));
  if (!isAiProviderId(body.provider)) {
    return NextResponse.json({ message: "请选择服务商" }, { status: 400 });
  }
  const submitted = parseByokApiKey(body.apiKey);
  if (submitted === null) {
    return NextResponse.json({ message: "请填写 API key" }, { status: 400 });
  }

  try {
    let apiKey = submitted;
    if (!apiKey) {
      const user = await currentUser(request);
      if (!user) {
        return NextResponse.json(
          { message: "请填写 API key" },
          { status: 400 },
        );
      }
      const existing = await readByokSecret(user.id);
      if (!existing || existing.provider !== body.provider) {
        return NextResponse.json(
          { message: "请填写 API key" },
          { status: 400 },
        );
      }
      apiKey = existing.apiKey;
    }
    const models = await listProviderModels(body.provider, apiKey);
    return NextResponse.json({ models });
  } catch (error) {
    return failure(error);
  }
}
