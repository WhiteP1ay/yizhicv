"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseRightPanelResizeOptions {
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  snapCollapseThreshold?: number;
  storageKey?: string;
}

/**
 * 右侧面板拖拽调节宽度 Hook
 *
 * 核心特性：
 * 1. 边缘拖拽反馈：支持从面板左边缘向左拖动拉宽、向右拖动收窄；
 * 2. 磁吸阈值判定：向右拖拽低于 snapCollapseThreshold 时自动吸附折叠（56px）；折叠状态向左拖动自动展开；
 * 3. 展开记忆恢复：折叠后再展开时精准记忆恢复至折叠前用户的首选宽度；
 * 4. 边界动态限制：依据视口宽度动态计算最大限制，保证画布主编辑区始终有充足空间；
 * 5. 极致平滑性能：拖拽期间自动挂载 transition-none，杜绝延迟掉帧；
 * 6. 用户偏好持久化：自动存储至 localStorage，刷新或重开保持心仪宽度；
 * 7. 快捷操作：支持双击调节条重置为默认宽度或折叠。
 */
export function useRightPanelResize(options: UseRightPanelResizeOptions = {}) {
  const {
    minWidth = 260,
    maxWidth = 780,
    defaultWidth = 336, // 对应 Tailwind w-84 (21rem)
    snapCollapseThreshold = 180,
    storageKey = "yizhicv_right_panel_width",
  } = options;

  const [width, setWidth] = useState<number>(defaultWidth);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // 记录最近一次展开的有效宽度，以便在折叠后再展开时精准恢复
  const lastWidthRef = useRef<number>(defaultWidth);
  const widthRef = useRef<number>(defaultWidth);
  widthRef.current = width;

  const activeMoveHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpHandlerRef = useRef<(() => void) | null>(null);

  // 客户端挂载后安全从 localStorage 恢复用户自定义面板宽度
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!Number.isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          setWidth(parsed);
          lastWidthRef.current = parsed;
        }
      }
    } catch {
      // 容错处理（私密浏览模式或无权限）
    }
  }, [storageKey, minWidth, maxWidth]);

  // 清理全局事件与鼠标手势样式
  const cleanupListeners = useCallback(() => {
    if (activeMoveHandlerRef.current) {
      document.removeEventListener("pointermove", activeMoveHandlerRef.current);
      activeMoveHandlerRef.current = null;
    }
    if (activeUpHandlerRef.current) {
      document.removeEventListener("pointerup", activeUpHandlerRef.current);
      activeUpHandlerRef.current = null;
    }
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setIsResizing(false);
  }, []);

  // 卸载保底清理
  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

  // 从折叠状态恢复时自动还原记忆宽度
  const handleSetIsCollapsed = useCallback(
    (action: React.SetStateAction<boolean>) => {
      setIsCollapsed((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        if (!next && prev) {
          setWidth(lastWidthRef.current || defaultWidth);
        }
        return next;
      });
    },
    [defaultWidth],
  );

  // 开始拖拽调节宽度
  const handlePointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      // 仅响应鼠标左键或首触点
      if (e.button !== 0) return;

      const startX = e.clientX;
      const startWidth = isCollapsed ? 56 : widthRef.current;
      const initialCollapsed = isCollapsed;
      const preDragWidth = lastWidthRef.current || defaultWidth;

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onPointerMove = (moveEvent: PointerEvent) => {
        // 右侧面板固定在右边缘，向左拖拽（moveEvent.clientX < startX）时宽度增大
        const deltaX = startX - moveEvent.clientX;
        const currentTargetWidth = startWidth + deltaX;

        // 计算最大可用宽度，确保不遮挡主编辑区（至少留出 320px 空间）
        const computedMaxWidth = Math.min(
          maxWidth,
          typeof window !== "undefined" ? window.innerWidth - 320 : maxWidth,
        );

        if (initialCollapsed) {
          // 折叠状态下向左拖拽超过 24px 时自动展开并跟随光标
          if (deltaX > 24) {
            setIsCollapsed(false);
            const nextWidth = Math.min(
              computedMaxWidth,
              Math.max(minWidth, preDragWidth + (deltaX - 24)),
            );
            setWidth(nextWidth);
            lastWidthRef.current = nextWidth;
          }
        } else {
          // 展开状态下向右拖动低于磁吸阈值时自动折叠
          if (currentTargetWidth < snapCollapseThreshold) {
            setIsCollapsed(true);
            // 折叠时不覆盖 preDragWidth，保留健康的展开记忆
          } else {
            setIsCollapsed(false);
            const clamped = Math.min(
              computedMaxWidth,
              Math.max(minWidth, Math.round(currentTargetWidth)),
            );
            setWidth(clamped);
            if (currentTargetWidth >= minWidth) {
              lastWidthRef.current = clamped;
            }
          }
        }
      };

      const onPointerUp = () => {
        cleanupListeners();
        // 持久化存储用户最近一次调节的展开宽度
        try {
          if (lastWidthRef.current >= minWidth) {
            localStorage.setItem(storageKey, String(lastWidthRef.current));
          }
        } catch {
          // ignore
        }
      };

      activeMoveHandlerRef.current = onPointerMove;
      activeUpHandlerRef.current = onPointerUp;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [
      isCollapsed,
      minWidth,
      maxWidth,
      defaultWidth,
      snapCollapseThreshold,
      storageKey,
      cleanupListeners,
    ],
  );

  // 双击拖拽把手快捷重置或折叠
  const handleDoubleClickResize = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setWidth(lastWidthRef.current || defaultWidth);
    } else if (Math.abs(width - defaultWidth) > 8) {
      // 若当前宽度不等于默认宽度，重置为默认宽度
      setWidth(defaultWidth);
      lastWidthRef.current = defaultWidth;
      try {
        localStorage.setItem(storageKey, String(defaultWidth));
      } catch {
        // ignore
      }
    } else {
      // 若已是默认宽度，则双击折叠
      setIsCollapsed(true);
    }
  }, [isCollapsed, width, defaultWidth, storageKey]);

  return {
    width,
    setWidth,
    isCollapsed,
    setIsCollapsed: handleSetIsCollapsed,
    isResizing,
    handlePointerDownResize,
    handleDoubleClickResize,
  };
}
