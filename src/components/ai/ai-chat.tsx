"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AssistantMarkdown } from "@/components/ai/assistant-markdown";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Message, MessageContent } from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { readLocalByok } from "@/lib/ai-byok-local";
import type { AiChatMode } from "@/lib/ai-mode";
import type { AiChatTurn } from "@/lib/ai-threads";
import { useLoginDialog } from "@/store/login-dialog";

const REPLY_DELTA_MS = 16;

function replyDeltas(text: string) {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  const deltas: string[] = [];
  for (const token of tokens) {
    const splitAt = token.search(/\s/);
    const body = splitAt === -1 ? token : token.slice(0, splitAt);
    const tail = splitAt === -1 ? "" : token.slice(splitAt);
    if (/^[\p{ASCII}]+$/u.test(body)) {
      deltas.push(token);
      continue;
    }
    const chars = Array.from(body);
    for (let index = 0; index < chars.length; index += 1) {
      deltas.push(
        index === chars.length - 1 ? `${chars[index]}${tail}` : chars[index],
      );
    }
  }
  return deltas;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function AiChat({
  mode,
  messages,
  pending,
  onMessages,
  onPending,
}: {
  mode: AiChatMode;
  messages: AiChatTurn[];
  pending: boolean;
  onMessages: (next: AiChatTurn[]) => void;
  onPending: (pending: boolean) => void;
}) {
  const setLoginOpen = useLoginDialog((state) => state.setOpen);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<{ id: string; text: string } | null>(
    null,
  );
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const send = async () => {
    const text = draft.trim();
    if (!text || pending) return;
    const history = [
      ...messages,
      { id: crypto.randomUUID(), role: "user" as const, content: text },
    ];
    onMessages(history);
    setDraft("");
    setError(null);
    onPending(true);

    try {
      const byok = mode === "byok" ? readLocalByok() : null;
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          ...(byok ? { byok } : {}),
        }),
      });
      const payload: { message?: string } = await response
        .json()
        .catch(() => ({}));
      if (response.status === 401) {
        setLoginOpen(true);
      }
      if (!response.ok) {
        setError(payload.message ?? "发送失败");
        return;
      }
      const reply = payload.message?.trim() || "（空回复）";
      const replyId = crypto.randomUUID();
      let shown = "";
      for (const delta of replyDeltas(reply)) {
        await wait(REPLY_DELTA_MS);
        if (!alive.current) return;
        shown += delta;
        setStream({ id: replyId, text: shown });
      }
      if (!alive.current) return;
      onMessages([
        ...history,
        { id: replyId, role: "assistant", content: reply },
      ]);
      setStream(null);
    } catch {
      setError("发送失败");
    } finally {
      onPending(false);
    }
  };

  const rows =
    stream && !messages.some((message) => message.id === stream.id)
      ? [
          ...messages,
          {
            id: stream.id,
            role: "assistant" as const,
            content: stream.text,
          },
        ]
      : messages;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent aria-busy={pending} className="gap-3 p-3">
              {rows.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                  style={
                    message.id === stream?.id
                      ? {
                          contentVisibility: "visible",
                          containIntrinsicSize: "none",
                        }
                      : undefined
                  }
                >
                  {message.role === "assistant" ? (
                    <Message align="start">
                      <MessageContent>
                        <AssistantMarkdown
                          streaming={message.id === stream?.id}
                          text={message.content}
                        />
                      </MessageContent>
                    </Message>
                  ) : (
                    <Message align="end">
                      <MessageContent>
                        <Bubble align="end" variant="muted">
                          <BubbleContent className="whitespace-pre-wrap text-xs">
                            {message.content}
                          </BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  )}
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          {rows.length === 0 ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[11px] text-slate-400">
              发一条消息开始对话
            </p>
          ) : null}
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      {pending && !stream ? (
        <p className="px-3 pb-1 text-[11px] text-slate-400">正在回复…</p>
      ) : null}
      {error ? (
        <p className="px-3 pb-1 text-[11px] text-red-600">{error}</p>
      ) : null}

      <form
        className="shrink-0 p-3 pt-1"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <InputGroup>
          <InputGroupTextarea
            data-testid="ai-chat-input"
            value={draft}
            rows={2}
            placeholder="输入消息"
            className="max-h-28 text-xs"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
          />
          <InputGroupAddon align="block-end" className="justify-end">
            <InputGroupButton
              type="submit"
              variant="default"
              size="sm"
              disabled={pending || draft.trim().length === 0}
              data-testid="ai-chat-send"
            >
              <Send />
              发送
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>
    </div>
  );
}
