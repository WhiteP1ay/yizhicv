"use client";

import { Check, MoreHorizontal } from "lucide-react";
import { useState } from "react";
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
import type { AiChatMode } from "@/lib/ai-mode";
import { AI_THREAD_PAGE, type AiThreadSummary } from "@/lib/ai-threads";

export function AiChatMenu({
  mode,
  authStatus,
  signedIn,
  pending,
  threads,
  activeId,
  onMode,
  onLogin,
  onOpenThread,
}: {
  mode: AiChatMode | null;
  authStatus: "loading" | "ready";
  signedIn: boolean;
  pending: boolean;
  threads: AiThreadSummary[];
  activeId: string | null;
  onMode: (mode: AiChatMode) => void;
  onLogin: () => void;
  onOpenThread: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(AI_THREAD_PAGE);
  const visibleThreads = threads.slice(0, visibleCount);

  return (
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
              if (authStatus === "loading") return;
              if (!signedIn) {
                onLogin();
                return;
              }
            }
            onMode(value);
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
                  onClick={() => onOpenThread(thread.id)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {thread.title}
                  </span>
                  {thread.id === activeId ? (
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
  );
}
