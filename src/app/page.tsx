"use client";

import { Printer } from "lucide-react";
import dynamic from "next/dynamic";

// 动态客户端加载 A4 画布
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

export default function Home() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100/90 relative select-none">
      {/* 核心居中 A4 纸张交互画布 (沉浸式纯净工作区，无任何冗余顶栏) */}
      <main className="flex-1 overflow-auto flex justify-center items-start p-6 md:p-12 relative">
        <A4PaperCanvas />
      </main>

      {/* 右下角轻量浮动导出按钮 (Cmd+P) */}
      <div className="no-print fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-semibold rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 backdrop-blur-md transition-all active:scale-95"
          title="调起打印或保存为矢量 PDF (Ctrl/Cmd+P)"
        >
          <Printer className="w-4 h-4" />
          <span>导出 PDF</span>
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            (⌘P)
          </span>
        </button>
      </div>
    </div>
  );
}
