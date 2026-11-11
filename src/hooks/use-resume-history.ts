"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "zustand";
import { useResumeStore } from "@/store/resume";

/**
 * 简历时间旅行（撤销/重做）Hook
 *
 * 核心特性：
 * 1. 深度集成 zundo temporal 状态机；
 * 2. 响应式感知历史栈深度：canUndo 与 canRedo 驱动顶部按钮与菜单的禁用态；
 * 3. document 全局键盘事件监听与平台自适应：
 *    - Mac: ⌘Z (撤销) / ⇧⌘Z (重做)
 *    - Windows / Linux: Ctrl+Z (撤销) / Ctrl+Shift+Z 或 Ctrl+Y (重做)
 * 4. 焦点防冲突守护：在普通 Input、Textarea、CodeMirror 或富文本内部打字时，
 *    优先让输入组件内部处理本地微观打字撤销；在非输入区时触发宏观文档快照回退。
 */
export function useResumeHistory() {
  const temporal = useResumeStore.temporal;

  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0);

  // 客户端挂载后探测操作系统，避免 SSR 阶段水合不一致
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setIsMac(
        /(mac|iphone|ipod|ipad)/i.test(
          navigator.platform || navigator.userAgent,
        ),
      );
    }
  }, []);

  const undo = useCallback(() => {
    if (canUndo) {
      temporal.getState().undo();
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      temporal.getState().redo();
    }
  }, [canRedo]);

  const clear = useCallback(() => {
    temporal.getState().clear();
  }, []);

  // document 全局快捷键监听（适配 Mac 与 Windows）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 若事件已被内部编辑器拦截消费，忽略
      if (e.defaultPrevented) return;

      // 若当前焦点在文本输入组件、CodeMirror 或富文本 ProseMirror 中，保留原生的微观撤销
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest(".cm-editor") ||
          target.closest(".ProseMirror"));

      if (isInput) return;

      const macPlatform =
        typeof navigator !== "undefined" &&
        /(mac|iphone|ipod|ipad)/i.test(
          navigator.platform || navigator.userAgent,
        );

      // Mac: ⌘Z, Win: Ctrl+Z
      const isUndo =
        (macPlatform ? e.metaKey : e.ctrlKey) &&
        !e.shiftKey &&
        e.key.toLowerCase() === "z";

      // Mac: ⇧⌘Z, Win: Ctrl+Shift+Z 或 Ctrl+Y
      const isRedo =
        (macPlatform &&
          e.metaKey &&
          e.shiftKey &&
          e.key.toLowerCase() === "z") ||
        (!macPlatform &&
          e.ctrlKey &&
          e.shiftKey &&
          e.key.toLowerCase() === "z") ||
        (!macPlatform && e.ctrlKey && e.key.toLowerCase() === "y");

      if (isUndo) {
        e.preventDefault();
        temporal.getState().undo();
      } else if (isRedo) {
        e.preventDefault();
        temporal.getState().redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    isMac,
    undoShortcut: isMac ? "⌘Z" : "Ctrl+Z",
    redoShortcut: isMac ? "⇧⌘Z" : "Ctrl+Shift+Z",
  };
}
