"use client";

import {
  Printer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { useResumeStore } from "@/store/resume";

export const ResumePreviewPane: React.FC = () => {
  const {
    resume,
    isBlurMode,
    previewScale,
    toggleBlurMode,
    setPreviewScale,
    setSidebarWidth,
  } = useResumeStore();

  const printContainerRef = useRef<HTMLDivElement>(null);

  const { layout, sections, design } = resume;
  const isSplitMode = layout.sidebarWidth > 0;

  // 分流各槽位模块
  const sidebarSections = sections.filter(
    (s) => s.visible && s.slot === "sidebar",
  );
  const mainSections = sections.filter((s) => s.visible && s.slot === "main");

  // 原生高保真打印
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/70 overflow-hidden relative select-none">
      {/* 顶部预览微控条 */}
      <div className="h-11 px-4 border-b border-slate-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between text-xs text-slate-600 z-10">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>A4 实时画布 (794×1123)</span>
          </span>

          {/* 快速侧栏宽度微调 */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200 text-[11px]">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>侧栏:</span>
            <input
              type="range"
              min={0}
              max={360}
              step={10}
              value={layout.sidebarWidth}
              onChange={(e) => setSidebarWidth(Number(e.target.value))}
              className="w-20 accent-slate-900 cursor-pointer"
              title={`侧栏宽度: ${layout.sidebarWidth}px (${
                layout.sidebarWidth === 0 ? "已折叠为单栏" : "双栏网格"
              })`}
            />
            <span className="font-mono text-slate-500 w-9">
              {layout.sidebarWidth === 0 ? "单栏" : `${layout.sidebarWidth}px`}
            </span>
          </div>
        </div>

        {/* 缩放、脱敏预览与导出工具 */}
        <div className="flex items-center gap-2">
          {/* 脱敏模式开关 */}
          <button
            type="button"
            onClick={toggleBlurMode}
            className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
              isBlurMode
                ? "bg-purple-600 text-white shadow-xs ring-1 ring-purple-600"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
            title="开启后，所有标记为脱敏的信息将自动应用高斯毛玻璃遮盖（适合公开分享截图）"
          >
            {isBlurMode ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>脱敏保护中</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>预览脱敏效果</span>
              </>
            )}
          </button>

          {/* 缩放控制器 */}
          <div className="flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewScale(previewScale - 0.1)}
              className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
              title="缩小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-700 min-w-[42px] text-center">
              {Math.round(previewScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setPreviewScale(previewScale + 0.1)}
              className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewScale(0.85)}
              className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
              title="重置缩放 (85%)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* 原生打印与导出 PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md flex items-center gap-1.5 shadow-xs transition-colors"
            title="调起系统打印或直接另存为矢量 PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>打印 / 导出 PDF</span>
          </button>
        </div>
      </div>

      {/* 画布视口滚动容器 */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
        {/* A4 画布纸张包装器 (处理缩放尺寸占用) */}
        <div
          style={{
            width: `${794 * previewScale}px`,
            minHeight: `${1123 * previewScale}px`,
          }}
          className="transition-all duration-150 ease-out flex-shrink-0"
        >
          {/* A4 标准物理比例纸张 (794px × 1123px) */}
          <div
            ref={printContainerRef}
            id="cv-print-target"
            className={`cv-page-a4 bg-white shadow-2xl transition-shadow duration-300 relative ${
              isBlurMode ? "cv-preview-blur" : ""
            } ${
              design.fontFamily === "serif"
                ? "font-serif"
                : design.fontFamily === "mono"
                  ? "font-mono"
                  : "font-sans"
            }`}
            style={
              {
                width: "794px",
                minHeight: "1123px",
                transform: `scale(${previewScale})`,
                transformOrigin: "top left",
                padding: `${design.pagePadding}mm`,
                fontSize: `${design.fontSize}pt`,
                lineHeight: design.lineHeight,
                color: "#1e293b",
                "--cv-theme": design.themeColor,
                "--cv-gap": `${design.sectionGap}px`,
              } as React.CSSProperties
            }
          >
            {/* 用户注入的自定义 CSS 钩子 */}
            {design.customCss && <style>{design.customCss}</style>}

            {/* 双槽位自适应网格 */}
            <div
              className="cv-grid-container grid gap-6 w-full h-full"
              style={{
                gridTemplateColumns: isSplitMode
                  ? layout.sidebarPosition === "left"
                    ? `${layout.sidebarWidth}px 1fr`
                    : `1fr ${layout.sidebarWidth}px`
                  : "1fr",
              }}
            >
              {/* 1. 侧边栏槽位 (当宽度 > 0 且处于左侧时排列于前) */}
              {isSplitMode && layout.sidebarPosition === "left" && (
                <aside className="cv-slot-sidebar flex flex-col gap-[var(--cv-gap)] border-r border-slate-200/80 pr-5">
                  {sidebarSections.map((sec) => (
                    <section
                      key={sec.id}
                      className="cv-section"
                      dangerouslySetInnerHTML={{ __html: sec.content }}
                    />
                  ))}
                </aside>
              )}

              {/* 2. 主栏槽位 */}
              <main className="cv-slot-main flex flex-col gap-[var(--cv-gap)]">
                {/* 如果处于单栏模式 (sidebarWidth === 0)，sidebar 里的内容自然置顶排列 */}
                {!isSplitMode &&
                  sidebarSections.map((sec) => (
                    <section
                      key={sec.id}
                      className="cv-section"
                      dangerouslySetInnerHTML={{ __html: sec.content }}
                    />
                  ))}

                {/* 正常主栏内容 */}
                {mainSections.map((sec) => (
                  <section
                    key={sec.id}
                    className="cv-section"
                    dangerouslySetInnerHTML={{ __html: sec.content }}
                  />
                ))}
              </main>

              {/* 3. 侧边栏槽位 (当宽度 > 0 且处于右侧时排列于后) */}
              {isSplitMode && layout.sidebarPosition === "right" && (
                <aside className="cv-slot-sidebar flex flex-col gap-[var(--cv-gap)] border-l border-slate-200/80 pl-5">
                  {sidebarSections.map((sec) => (
                    <section
                      key={sec.id}
                      className="cv-section"
                      dangerouslySetInnerHTML={{ __html: sec.content }}
                    />
                  ))}
                </aside>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
