"use client";

import { Edit3, Eye } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { TopNav } from "@/components/layout/top-nav";

// 动态客户端加载编辑器与预览组件（避免 SSR 阶段 Tiptap/DOM 随机 ID 引起的水合与预渲染警告）
const SectionEditorPane = dynamic(
  () =>
    import("@/components/editor/section-editor-pane").then(
      (mod) => mod.SectionEditorPane,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400 text-xs">
        正在加载富文本编辑器...
      </div>
    ),
  },
);

const ResumePreviewPane = dynamic(
  () =>
    import("@/components/preview/resume-preview-pane").then(
      (mod) => mod.ResumePreviewPane,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
        正在加载 A4 画布...
      </div>
    ),
  },
);

export default function Home() {
  const [mobileTab, setMobileTab] = useState<"editor" | "preview">("editor");

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* 顶部全局导航栏 */}
      <TopNav />

      {/* 移动端视图切换开关 (< md) */}
      <div className="md:hidden flex border-b border-slate-200 bg-slate-50 text-xs">
        <button
          type="button"
          onClick={() => setMobileTab("editor")}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "editor"
              ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>富文本编辑</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2 font-medium flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "preview"
              ? "bg-white text-slate-900 border-b-2 border-slate-900 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>A4 画布预览</span>
        </button>
      </div>

      {/* 核心左右双轨工作区 */}
      <main className="flex-1 flex overflow-hidden">
        {/* 左侧：富文本与模块编辑区 */}
        <div
          className={`w-full md:w-[46%] lg:w-[42%] xl:w-[38%] h-full flex-shrink-0 ${
            mobileTab === "editor"
              ? "flex flex-col"
              : "hidden md:flex md:flex-col"
          }`}
        >
          <SectionEditorPane />
        </div>

        {/* 右侧：A4 画布实时预览区 */}
        <div
          className={`flex-1 h-full min-w-0 ${
            mobileTab === "preview"
              ? "flex flex-col"
              : "hidden md:flex md:flex-col"
          }`}
        >
          <ResumePreviewPane />
        </div>
      </main>
    </div>
  );
}
