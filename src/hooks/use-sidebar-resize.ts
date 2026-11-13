"use client";

import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useResumeStore } from "@/store/resume";

interface UseSidebarResizeOptions {
  minWidth?: number;
  maxWidth?: number;
  snapThreshold?: number;
  defaultExpandWidth?: number;
}

/**
 * A4 画布侧边栏拖拽中线尺寸调节 Hook
 *
 * 核心特性：
 * 1. 视口缩放感知：自动补偿 previewScale 缩放比例，保证拖拽物理位移 1:1 响应；
 * 2. 磁吸阈值判定：向左拖动低于 snapThreshold 时自动吸附至 0px（纯单栏文档流）；
 * 3. 边界安全钳位：范围限制在 minWidth ~ maxWidth 之间；
 * 4. 健壮的生命周期清理：组件卸载或手势中断时自动清理全局 pointer 监听与样式。
 */
export function useSidebarResize(options: UseSidebarResizeOptions = {}) {
  const {
    minWidth = 120,
    maxWidth = 580,
    snapThreshold = 70,
    defaultExpandWidth = 180,
  } = options;

  const { resume, setSidebarWidth } = useResumeStore();
  const { previewScale } = resume.settings;
  const [isResizing, setIsResizing] = useState(false);

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

  // 卸载保底清理，防止拖拽过程中意外 unmount 导致事件残留
  useEffect(() => {
    return cleanupListeners;
  }, [cleanupListeners]);

  const handlePointerDownResize = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      // 仅响应鼠标左键或首触点
      if (e.button !== 0) return;

      const startX = e.clientX;
      const currentWidth = resume.layout.sidebarWidth;
      const startWidth = currentWidth > 0 ? currentWidth : defaultExpandWidth;

      setIsResizing(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onPointerMove = (moveEvent: PointerEvent) => {
        const deltaX = (moveEvent.clientX - startX) / previewScale;
        const nextWidth = startWidth + deltaX;

        // 磁吸阈值：拉到阈值以内自动吸附为 0（纯单栏）
        if (nextWidth < snapThreshold) {
          setSidebarWidth(0);
        } else {
          const clamped = Math.min(
            maxWidth,
            Math.max(minWidth, Math.round(nextWidth)),
          );
          setSidebarWidth(clamped);
        }
      };

      const onPointerUp = () => {
        cleanupListeners();
      };

      activeMoveHandlerRef.current = onPointerMove;
      activeUpHandlerRef.current = onPointerUp;

      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
    },
    [
      resume.layout.sidebarWidth,
      defaultExpandWidth,
      previewScale,
      snapThreshold,
      maxWidth,
      minWidth,
      setSidebarWidth,
      cleanupListeners,
    ],
  );

  return {
    isResizing,
    handlePointerDownResize,
  };
}
