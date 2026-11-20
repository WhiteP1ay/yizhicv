"use client";

import { Check, MoreHorizontal, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AiChat } from "@/components/ai/ai-chat";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { type AiChatMode, readAiMode, writeAiMode } from "@/lib/ai-mode";
import {
  importRemoteThreads,
  listRemoteThreads,
  readRemoteThread,
  saveRemoteThread,
} from "@/lib/ai-thread-remote";
import {
  AI_THREAD_LIMIT,
  AI_THREAD_PAGE,
  type AiChatTurn,
  type AiThread,
  type AiThreadSummary,
  clearStoredThreads,
  listThreadSummaries,
  readCurrentThreadId,
  readStoredThreads,
  readThread,
  titleFromMessages,
  upsertThread,
  writeCurrentThreadId,
} from "@/lib/ai-threads";
import { useSettingsDialog } from "@/store/api-key-dialog";
import { useLoginDialog } from "@/store/login-dialog";

function modeLabel(mode: AiChatMode | null) {
  if (mode === "byok") return "BYOK";
  if (mode === "platform") return "账号额度";
  return "AI";
}

export function AiPanel() {
  const { status, user } = useCurrentUser();
  const setLoginOpen = useLoginDialog((state) => state.setOpen);
  const openSettings = useSettingsDialog((state) => state.openDialog);
  const [mode, setMode] = useState<AiChatMode | null>(null);
  const [ready, setReady] = useState(false);
  const [threads, setThreads] = useState<AiThreadSummary[]>([]);
  const [visibleCount, setVisibleCount] = useState(AI_THREAD_PAGE);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [viewKey, setViewKey] = useState("draft");
  const [messages, setMessages] = useState<AiChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const threadIdRef = useRef<string | null>(null);
  const threadCache = useRef(new Map<string, AiThread>());
  const epoch = useRef(0);

  const showThread = useCallback((thread: AiThread) => {
    threadCache.current.set(thread.id, thread);
    threadIdRef.current = thread.id;
    setThreadId(thread.id);
    writeCurrentThreadId(thread.id);
    setMessages(thread.messages);
    setViewKey(thread.id);
  }, []);

  useEffect(() => {
    if (status !== "ready") return;
    const ticket = epoch.current;
    let cancelled = false;
    const stale = () => cancelled || epoch.current !== ticket;

    const loadLocal = () => {
      for (const thread of readStoredThreads()) {
        threadCache.current.set(thread.id, thread);
      }
      setThreads(listThreadSummaries());
      const currentId = readCurrentThreadId();
      const current = currentId ? readThread(currentId) : null;
      if (current) showThread(current);
    };

    const run = async () => {
      const nextMode = readAiMode();
      if (!user) {
        if (stale()) return;
        loadLocal();
        setMode(nextMode);
        setReady(true);
        return;
      }

      const local = readStoredThreads();
      const summaries =
        local.length > 0
          ? await importRemoteThreads(local)
          : await listRemoteThreads();
      if (stale()) return;
      if (!summaries) {
        loadLocal();
        setMode(nextMode);
        setReady(true);
        return;
      }
      if (local.length > 0) clearStoredThreads();
      setThreads(summaries);

      const currentId = readCurrentThreadId();
      if (currentId && epoch.current === ticket) {
        const thread = await readRemoteThread(currentId);
        if (stale()) return;
        if (thread) showThread(thread);
      }
      setMode(nextMode);
      setReady(true);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [showThread, status, user]);

  const choose = (next: AiChatMode) => {
    writeAiMode(next);
    setMode(next);
  };

  const commit = (next: AiChatTurn[]) => {
    epoch.current += 1;
    setMessages(next);
    if (next.length === 0) return;
    const id = threadIdRef.current ?? crypto.randomUUID();
    const thread: AiThread = {
      id,
      title: titleFromMessages(next),
      updatedAt: Date.now(),
      messages: next,
    };
    threadCache.current.set(id, thread);
    threadIdRef.current = id;
    setThreadId(id);
    writeCurrentThreadId(id);
    const summary: AiThreadSummary = {
      id,
      title: thread.title,
      updatedAt: thread.updatedAt,
    };
    if (user) {
      setThreads((current) =>
        [summary, ...current.filter((item) => item.id !== id)].slice(
          0,
          AI_THREAD_LIMIT,
        ),
      );
      void saveRemoteThread(thread).then((ok) => {
        if (!ok) upsertThread(thread);
      });
      return;
    }
    setThreads(upsertThread(thread));
  };

  const startNew = () => {
    if (pending) return;
    threadIdRef.current = null;
    setThreadId(null);
    writeCurrentThreadId(null);
    setMessages([]);
    setViewKey(crypto.randomUUID());
  };

  const openThread = (id: string) => {
    if (pending || id === threadIdRef.current) return;
    const cached = threadCache.current.get(id);
    if (cached) {
      epoch.current += 1;
      showThread(cached);
      return;
    }
    if (!user) {
      const thread = readThread(id);
      if (!thread) return;
      showThread(thread);
      return;
    }
    epoch.current += 1;
    const ticket = epoch.current;
    void readRemoteThread(id).then((thread) => {
      if (!thread || epoch.current !== ticket) return;
      showThread(thread);
    });
  };

  const visibleThreads = threads.slice(0, visibleCount);
  const currentTitle =
    threads.find((thread) => thread.id === threadId)?.title ?? "";

  return (
    <div data-testid="ai-panel" className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-slate-100 px-1.5">
        <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium text-slate-800">
          {currentTitle || "AI"}
        </span>
        {mode ? (
          <span className="shrink-0 text-[11px] text-slate-400">
            {modeLabel(mode)}
          </span>
        ) : null}
        <button
          type="button"
          aria-label="新对话"
          title="新对话"
          data-testid="ai-new-chat"
          disabled={!mode || pending}
          className="inline-flex size-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40"
          onClick={startNew}
        >
          <Plus className="size-3.5" />
        </button>
        <DropdownMenu
          onOpenChange={(open) => {
            if (open) setVisibleCount(AI_THREAD_PAGE);
          }}
        >
          <DropdownMenuTrigger
            aria-label="对话菜单"
            title="对话菜单"
            data-testid="ai-chat-menu"
            className="inline-flex size-6 items-center justify-center rounded-md text-slate-500 outline-none hover:bg-slate-100 hover:text-slate-800 data-popup-open:bg-slate-100"
          >
            <MoreHorizontal className="size-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56! min-w-56 text-xs">
            <DropdownMenuRadioGroup
              value={mode ?? ""}
              onValueChange={(value) => {
                if (value !== "byok" && value !== "platform") return;
                if (value === "platform") {
                  if (status === "loading") return;
                  if (!user) {
                    setLoginOpen(true);
                    return;
                  }
                }
                choose(value);
              }}
            >
              <DropdownMenuLabel>模式</DropdownMenuLabel>
              <DropdownMenuRadioItem value="byok" className="text-xs">
                BYOK
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="platform" className="text-xs">
                账号额度
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className="text-xs"
                data-testid="ai-thread-menu"
              >
                历史对话
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                side="left"
                className="w-56! min-w-56 text-xs"
              >
                {visibleThreads.length === 0 ? (
                  <DropdownMenuItem disabled className="text-xs text-slate-400">
                    暂无对话
                  </DropdownMenuItem>
                ) : (
                  visibleThreads.map((thread) => (
                    <DropdownMenuItem
                      key={thread.id}
                      className="text-xs"
                      disabled={pending}
                      data-testid="ai-thread"
                      onClick={() => openThread(thread.id)}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {thread.title}
                      </span>
                      {thread.id === threadId ? (
                        <Check className="size-3.5 text-slate-500" />
                      ) : null}
                    </DropdownMenuItem>
                  ))
                )}
                {threads.length > visibleCount ? (
                  <DropdownMenuItem
                    className="justify-center text-[11px] text-slate-500"
                    closeOnClick={false}
                    data-testid="ai-threads-more"
                    onClick={() =>
                      setVisibleCount((count) => count + AI_THREAD_PAGE)
                    }
                  >
                    加载更多
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mode ? (
        <AiChat
          key={viewKey}
          mode={mode}
          messages={messages}
          pending={pending}
          onMessages={commit}
          onPending={setPending}
        />
      ) : ready ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            data-testid="ai-byok"
            onClick={() => {
              choose("byok");
              openSettings();
            }}
          >
            BYOK
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            data-testid="ai-direct"
            onClick={() => {
              if (status === "loading") return;
              if (!user) {
                setLoginOpen(true);
                return;
              }
              choose("platform");
            }}
          >
            账号额度
          </Button>
        </div>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  );
}
