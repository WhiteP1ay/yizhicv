"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/store/resume";

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
 * 1. 同步简历设置项：宽度与折叠状态直接与 resume.setting 联动，支持 JSON 导入导出与持久化；
 * 2. 边缘拖拽反馈：支持从面板左边缘向左拖动拉宽、向右拖动收窄；
 * 3. 磁吸阈值判定：向右拖拽低于 snapCollapseThreshold 时自动吸附折叠（56px）；折叠状态向左拖动自动展开；
 * 4. 展开记忆恢复：折叠后再展开时精准记忆恢复至折叠前用户的首选宽度；
 * 5. 边界动态限制：依据视口宽度动态计算最大限制，保证画布主编辑区始终有充足空间；
 * 6. 快捷操作：支持双击调节条重置为默认宽度或折叠。
 */
export function useRightPanelResize(options: UseRightPanelResizeOptions = {}) {
  const {
    minWidth = 260,
    maxWidth = 780,
    defaultWidth = 336, // 对应 Tailwind w-84 (21rem)
    snapCollapseThreshold = 180,
    storageKey = "yizhicv_right_panel_width",
  } = options;

  const {
    rightPanelWidth,
    isRightPanelCollapsed,
    setRightPanelWidth,
    setIsRightPanelCollapsed,
  } = useResumeStore();

  const width = rightPanelWidth || defaultWidth;
  const isCollapsed = isRightPanelCollapsed;
  const [isResizing, setIsResizing] = useState(false);

  // 记录最近一次展开的有效宽度，以便在折叠后再展开时精准恢复
  const lastWidthRef = useRef<number>(width >= minWidth ? width : defaultWidth);
  const widthRef = useRef<number>(width);
  widthRef.current = width;

  useEffect(() => {
    if (width >= minWidth) {
      lastWidthRef.current = width;
    }
  }, [width, minWidth]);

  const activeMoveHandlerRef = useRef<((e: PointerEvent) => void) | null>(null);
  const activeUpHandlerRef = useRef<(() => void) | null>(null);

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
      setIsRightPanelCollapsed((prev) => {
        const next = typeof action === "function" ? action(prev) : action;
        if (!next && prev) {
          setRightPanelWidth(lastWidthRef.current || defaultWidth);
        }
        return next;
      });
    },
    [defaultWidth, setIsRightPanelCollapsed, setRightPanelWidth],
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
            setIsRightPanelCollapsed(false);
            const nextWidth = Math.min(
              computedMaxWidth,
              Math.max(minWidth, preDragWidth + (deltaX - 24)),
            );
            setRightPanelWidth(nextWidth);
            lastWidthRef.current = nextWidth;
          }
        } else {
          // 展开状态下向右拖动低于磁吸阈值时自动折叠
          if (currentTargetWidth < snapCollapseThreshold) {
            setIsRightPanelCollapsed(true);
          } else {
            setIsRightPanelCollapsed(false);
            const clamped = Math.min(
              computedMaxWidth,
              Math.max(minWidth, Math.round(currentTargetWidth)),
            );
            setRightPanelWidth(clamped);
            if (currentTargetWidth >= minWidth) {
              lastWidthRef.current = clamped;
            }
          }
        }
      };

      const onPointerUp = () => {
        cleanupListeners();
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
      setIsRightPanelCollapsed,
      setRightPanelWidth,
    ],
  );

  // 双击拖拽把手快捷重置或折叠
  const handleDoubleClickResize = useCallback(() => {
    if (isCollapsed) {
      setIsRightPanelCollapsed(false);
      setRightPanelWidth(lastWidthRef.current || defaultWidth);
    } else if (Math.abs(width - defaultWidth) > 8) {
      setRightPanelWidth(defaultWidth);
      lastWidthRef.current = defaultWidth;
      try {
        localStorage.setItem(storageKey, String(defaultWidth));
      } catch {
        // ignore
      }
    } else {
      setIsRightPanelCollapsed(true);
    }
  }, [
    isCollapsed,
    width,
    defaultWidth,
    storageKey,
    setIsRightPanelCollapsed,
    setRightPanelWidth,
  ]);

  return {
    width,
    setWidth: setRightPanelWidth,
    isCollapsed,
    setIsCollapsed: handleSetIsCollapsed,
    isResizing,
    handlePointerDownResize,
    handleDoubleClickResize,
  };
}
