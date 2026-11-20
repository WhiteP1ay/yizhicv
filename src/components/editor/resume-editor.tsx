"use client";

import dynamic from "next/dynamic";
import type React from "react";
import { useCallback, useEffect } from "react";
import { Toaster } from "sonner";
import { SettingsDialog } from "@/components/ai/settings-dialog";
import { ImageTray } from "@/components/canvas/image-tray";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { LoginDialog } from "@/components/layout/login-dialog";
import { RightPanel } from "@/components/panel/right-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useResumeDocument } from "@/hooks/use-resume-document";
import { useActiveEditorStore } from "@/store/active-editor";
import { useResumeStore } from "@/store/resume";

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

export function ResumeEditor({ resumeId }: { resumeId: string }) {
  const ready = useResumeDocument(resumeId);
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

  const handleWorkspacePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest(".cv-section-container")) return;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest(".canvas-top-bar") ||
      target.closest(".cursor-col-resize")
    ) {
      return;
    }
    handleDeselect();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleDeselect();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleDeselect]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100/90 relative select-none">
      <AppTopBar />

      <div className="flex-1 flex overflow-hidden relative">
        {ready ? (
          <>
            <main
              data-testid="canvas-workspace"
              onPointerDown={handleWorkspacePointerDown}
              className="flex-1 overflow-auto flex justify-center items-start p-6 md:p-12 relative"
            >
              <A4PaperCanvas />
            </main>
            <RightPanel />
          </>
        ) : (
          <main className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            正在打开这份简历…
          </main>
        )}
      </div>

      <ImageTray />
      <LoginDialog />
      <SettingsDialog />
      <ConfirmDialog />
      <Toaster position="top-center" richColors />
    </div>
  );
}
