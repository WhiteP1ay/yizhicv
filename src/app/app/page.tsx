"use client";

import dynamic from "next/dynamic";
import { AppTopBar } from "@/components/layout/app-top-bar";

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
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100/90 relative select-none">
      {/* 顶部工具栏 (含文件菜单：新建、导入 JSON、导出 -> 导出PDF/JSON) */}
      <AppTopBar />

      {/* 核心居中 A4 纸张交互画布工作区 */}
      <main className="flex-1 overflow-auto flex justify-center items-start p-6 md:p-12 relative">
        <A4PaperCanvas />
      </main>
    </div>
  );
}
