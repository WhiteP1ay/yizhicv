"use client";

import { type RefObject, useEffect } from "react";

interface UseClickOutsideOptions {
  enabled?: boolean;
  onEscape?: boolean;
}

/**
 * 通用点击外部与 Esc 键监听 Hook
 * 用于菜单、弹窗、气泡列表等浮层的无感自动收起
 *
 * @param ref 监听的目标元素 ref（支持单个或数组）
 * @param handler 触发外部点击或按 Esc 时的回调函数
 * @param options 配置项（enabled: 是否启用监听, onEscape: 是否响应 Esc 键）
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null> | Array<RefObject<T | null>>,
  handler: () => void,
  options: UseClickOutsideOptions = {},
) {
  const { enabled = true, onEscape = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const refs = Array.isArray(ref) ? ref : [ref];
      const isInside = refs.some((r) => r.current?.contains(target));

      if (!isInside) {
        handler();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (onEscape && event.key === "Escape") {
        handler();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    if (onEscape) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      if (onEscape) {
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
  }, [ref, handler, enabled, onEscape]);
}
