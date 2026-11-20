import { type NextRequest, NextResponse } from "next/server";
import { parseInlineByok } from "@/lib/ai-providers";
import {
  beginDirectUse,
  releaseDirectUse,
  settleDirectUse,
} from "@/server/ai-ledger";
import { estimatePromptTokens, MAX_OUTPUT_TOKENS } from "@/server/ai-pricing";
import { ByokEndpointError } from "@/server/ai-providers";
import { currentUser } from "@/server/auth";
import { ByokStoreError, readByokSecret } from "@/server/byok-store";
import {
  completeChat,
  DeepSeekRequestError,
  readPlatformKey,
} from "@/server/deepseek";
import { completeByokChat, ProviderRequestError } from "@/server/provider-chat";

type ChatTurn = { role: "user" | "assistant"; content: string };

function parseMessages(value: unknown): ChatTurn[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    return null;
  }
  const messages: ChatTurn[] = [];
  let chars = 0;
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string") return null;
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 4000) return null;
    chars += trimmed.length;
    if (chars > 24_000) return null;
    messages.push({ role, content: trimmed });
  }
  if (messages[messages.length - 1]?.role !== "user") return null;
  return messages;
}

async function readAccountByok(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return null;
  return readByokSecret(user.id);
}

function failureMessage(error: unknown, mode: "platform" | "byok") {
  if (
    mode === "byok" &&
    (error instanceof ProviderRequestError ||
      error instanceof DeepSeekRequestError) &&
    (error.status === 401 || error.status === 403)
  ) {
    return { status: 400, message: "API key 无效" };
  }
  if (error instanceof ByokStoreError || error instanceof ByokEndpointError) {
    return { status: error.status, message: error.message };
  }
  if (error instanceof Error && error.name === "TimeoutError") {
    return { status: 504, message: "模型响应超时" };
  }
  return { status: 502, message: "模型暂时不可用" };
}

export async function POST(request: NextRequest) {
  const body: { mode?: unknown; messages?: unknown; byok?: unknown } =
    await request.json().catch(() => ({}));
  const mode =
    body.mode === "platform" || body.mode === "byok" ? body.mode : null;
  const messages = parseMessages(body.messages);
  if (!mode || !messages) {
    return NextResponse.json({ message: "消息格式不正确" }, { status: 400 });
  }

  if (mode === "byok") {
    const inline = parseInlineByok(body.byok);
    if (inline && "error" in inline) {
      return NextResponse.json({ message: inline.error }, { status: 400 });
    }
    try {
      const saved = inline ?? (await readAccountByok(request));
      if (!saved) {
        return NextResponse.json(
          { message: "请先配置 API key" },
          { status: 400 },
        );
      }
      if (!saved.model) {
        return NextResponse.json(
          { message: "请先获取并选择模型" },
          { status: 400 },
        );
      }
      const result = await completeByokChat({
        provider: saved.provider,
        model: saved.model,
        apiKey: saved.apiKey,
        baseUrl: saved.baseUrl,
        wire: saved.wire,
        messages,
        maxTokens: MAX_OUTPUT_TOKENS,
      });
      return NextResponse.json({ message: result.text });
    } catch (error) {
      const failure = failureMessage(error, "byok");
      return NextResponse.json(
        { message: failure.message },
        { status: failure.status },
      );
    }
  }

  {
    const user = await currentUser(request);
    if (!user) {
      return NextResponse.json({ message: "请先登录" }, { status: 401 });
    }
    const apiKey = readPlatformKey();
    if (!apiKey) {
      return NextResponse.json({ message: "模型服务未就绪" }, { status: 503 });
    }

    const requestId = crypto.randomUUID();
    const started = await beginDirectUse({
      userId: user.id,
      requestId,
      estimatedInputTokens: estimatePromptTokens(messages),
      now: new Date(),
    });
    if (!started.ok) {
      return NextResponse.json(
        {
          message: "余额不足，无法再直接使用",
          balancePicoCny: started.balancePicoCny.toString(),
        },
        { status: 402 },
      );
    }

    try {
      const result = await completeChat({
        apiKey,
        messages,
        maxTokens: started.maxTokens,
      });
      const settled = await settleDirectUse({
        userId: user.id,
        requestId,
        usage: result.usage,
        prices: started.prices,
      });
      return NextResponse.json({
        message: result.text,
        balancePicoCny: settled.balancePicoCny.toString(),
      });
    } catch (error) {
      try {
        await releaseDirectUse(user.id, requestId);
      } catch {
        // 预扣过期后，由之后的请求退回余额。
      }
      const failure = failureMessage(error, mode);
      return NextResponse.json(
        { message: failure.message },
        { status: failure.status },
      );
    }
  }
}
