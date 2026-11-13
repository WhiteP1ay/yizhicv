"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { useCallback, useEffect } from "react";
import { Toaster } from "sonner";
import { ImageTray } from "@/components/canvas/image-tray";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { LoginDialog } from "@/components/layout/login-dialog";
import { RightPanel } from "@/components/panel/right-panel";
import { useActiveEditorStore } from "@/store/active-editor";
import { useResumeStore } from "@/store/resume";

// 动态客户端加载 A4 画布，避免 SSR 阶段 Tiptap 与 Math.random() 引起水合不一致
const A4PaperCanvas = dynamic(
  () =>
    import("@/components/canvas/a4-paper-canvas").then(
      (mod) => mod.A4PaperCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
        正在渲染 A4 画布...
      </div>
    ),
  },
);

export default function AppPage() {
  const { setActiveSectionId } = useResumeStore();
  const { setActiveEditor } = useActiveEditorStore();

  const handleDeselect = useCallback(() => {
    setActiveSectionId(null);
    setActiveEditor(null);
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.tagName !== "BODY"
    ) {
      document.activeElement.blur();
    }
  }, [setActiveSectionId, setActiveEditor]);

  // 1. 点击画布空白区域（灰色衬底、A4 纸张边距、模块之间留白等）取消选中编辑块
  const handleWorkspacePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    // 若点击在任何编辑模块容器或其悬浮工具手柄内，保留选中
    if (target.closest(".cv-section-container")) {
      return;
    }

    // 若点击在交互按钮（如添加新模块）、输入框、分栏调节条或顶部操作栏内，保留
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest(".canvas-top-bar") ||
      target.closest(".cursor-col-resize")
    ) {
      return;
    }

    // 点击了真正的空白区域，取消选中
    handleDeselect();
  };

  // 2. 键盘 Escape 键全局快捷取消选中
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDeselect();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeselect]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100/90 relative select-none">
      {/* 顶部工具栏 (含文件菜单：新建、导入 JSON、导出 -> 导出PDF/JSON) */}
      <AppTopBar />

      {/* 工作区：居中 A4 纸张画布 + 右侧属性与设计定制面板 */}
      <div className="flex-1 flex overflow-hidden relative">
        <main
          data-testid="canvas-workspace"
          onPointerDown={handleWorkspacePointerDown}
          className="flex-1 overflow-auto flex justify-center items-start p-6 md:p-12 relative"
        >
          <A4PaperCanvas />
        </main>

        {/* 右侧设计面板 */}
        <RightPanel />
      </div>

      <ImageTray />

      <LoginDialog />

      {/* 全局消息提示 */}
      <Toaster position="top-center" richColors />
    </div>
  );
}
