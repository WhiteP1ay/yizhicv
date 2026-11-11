"use client";

import dynamic from "next/dynamic";
import { UnifiedTopBar } from "@/components/layout/unified-top-bar";

const A4PaperCanvas = dynamic(
  () =>
    import("@/components/canvas/a4-paper-canvas").then(
      (mod) => mod.A4PaperCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
        正在加载 A4 画布...
      </div>
    ),
  },
);

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100/90">
      {/* 顶部统一功能条 */}
      <UnifiedTopBar />

      {/* 核心居中 A4 纸张交互画布工作区 */}
      <main className="flex-1 overflow-auto flex justify-center items-start p-6 md:p-10 relative">
        <A4PaperCanvas />
      </main>
    </div>
  );
}
