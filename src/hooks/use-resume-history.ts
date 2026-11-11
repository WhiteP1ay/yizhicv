"use client";

import { useEffect } from "react";
import { useStore } from "zustand";
import { useResumeStore } from "@/store/resume";

/**
 * 简历时间旅行（撤销/重做）Hook
 *
 * 核心特性：
 * 1. 深度集成 zundo temporal 状态机；
 * 2. 响应式感知历史栈深度：canUndo 与 canRedo 驱动顶部按钮的显隐与禁用态；
 * 3. 焦点防冲突：在用户于普通 input / textarea 或 contenteditable 富文本内部输入时，
 *    优先交给原生/Tiptap处理内部微观撤销；其他区域按 ⌘Z / ⌘⇧Z 触发宏观文档级快照撤销。
 */
export function useResumeHistory() {
  const temporal = useResumeStore.temporal;

  const canUndo = useStore(temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(temporal, (s) => s.futureStates.length > 0);

  const undo = () => {
    if (canUndo) {
      temporal.getState().undo();
    }
  };

  const redo = () => {
    if (canRedo) {
      temporal.getState().redo();
    }
  };

  const clear = () => {
    temporal.getState().clear();
  };

  // 全局 ⌘Z / ⌘⇧Z 快捷键监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 若当前焦点在文本输入、CodeMirror 或可编辑节点内，避免与微观文本撤销冲突
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.closest(".cm-editor") ||
          target.closest(".ProseMirror"));

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (isInput) return;

        e.preventDefault();
        if (e.shiftKey) {
          temporal.getState().redo();
        } else {
          temporal.getState().undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
  };
}
