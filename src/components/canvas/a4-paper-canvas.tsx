"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useResumeStore } from "@/store/resume";
import { SECTION_PRESETS } from "@/types/resume";
import { EditableSection } from "./editable-section";

export const A4PaperCanvas: React.FC = () => {
  const { resume, isBlurMode, previewScale, addSectionFromPreset } =
    useResumeStore();
  const { layout, sections, design } = resume;

  const [activeAddSlot, setActiveAddSlot] = useState<"main" | "sidebar" | null>(
    null,
  );

  const isSplitMode = layout.sidebarWidth > 0;
  const sidebarSections = sections.filter(
    (s) => s.visible && s.slot === "sidebar",
  );
  const mainSections = sections.filter((s) => s.visible && s.slot === "main");

  return (
    <div
      style={{
        width: `${794 * previewScale}px`,
        minHeight: `${1123 * previewScale}px`,
      }}
      className="transition-all duration-150 ease-out flex-shrink-0"
    >
      {/* 真实 A4 物理比例纸张 (794px × 1123px) */}
      <div
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
        {/* 用户自定 CSS 钩子 */}
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
          {/* 1. 侧边栏槽位 (当宽度 > 0 且在左侧) */}
          {isSplitMode && layout.sidebarPosition === "left" && (
            <aside className="cv-slot-sidebar flex flex-col gap-[var(--cv-gap)] border-r border-slate-200/80 pr-5">
              {sidebarSections.map((sec) => (
                <EditableSection key={sec.id} section={sec} />
              ))}

              {/* 侧栏底部快速追加 */}
              <div className="no-print mt-2 relative">
                <button
                  type="button"
                  onClick={() => setActiveAddSlot("sidebar")}
                  className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 rounded text-[11px] text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加侧栏模块</span>
                </button>

                {activeAddSlot === "sidebar" && (
                  <>
                    <button
                      type="button"
                      aria-label="关闭选择菜单"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setActiveAddSlot(null)}
                    />
                    <div className="absolute left-0 bottom-full mb-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        添加预设至侧栏
                      </div>
                      {Object.values(SECTION_PRESETS).map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => {
                            addSectionFromPreset(p.key, "sidebar");
                            setActiveAddSlot(null);
                          }}
                          className="w-full px-3 py-1.5 hover:bg-slate-50 text-xs text-slate-700 block text-left"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </aside>
          )}

          {/* 2. 主栏槽位 */}
          <main className="cv-slot-main flex flex-col gap-[var(--cv-gap)]">
            {/* 单栏模式下，侧栏内容自然置顶折叠 */}
            {!isSplitMode &&
              sidebarSections.map((sec) => (
                <EditableSection key={sec.id} section={sec} />
              ))}

            {/* 主栏所有 Section */}
            {mainSections.map((sec) => (
              <EditableSection key={sec.id} section={sec} />
            ))}

            {/* 主栏底部快速追加 */}
            <div className="no-print mt-4 relative">
              <button
                type="button"
                onClick={() => setActiveAddSlot("main")}
                className="w-full py-2.5 border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/60 rounded-md text-xs text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>在此处添加新模块 (经历 / 作品 / 技能)</span>
              </button>

              {activeAddSlot === "main" && (
                <>
                  <button
                    type="button"
                    aria-label="关闭选择菜单"
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setActiveAddSlot(null)}
                  />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      添加预设模块
                    </div>
                    {Object.values(SECTION_PRESETS).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          addSectionFromPreset(p.key, "main");
                          setActiveAddSlot(null);
                        }}
                        className="w-full px-3 py-2 hover:bg-slate-50 flex flex-col text-left transition-colors"
                      >
                        <span className="text-xs font-medium text-slate-800">
                          {p.name}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>

          {/* 3. 侧边栏槽位 (当宽度 > 0 且在右侧) */}
          {isSplitMode && layout.sidebarPosition === "right" && (
            <aside className="cv-slot-sidebar flex flex-col gap-[var(--cv-gap)] border-l border-slate-200/80 pl-5">
              {sidebarSections.map((sec) => (
                <EditableSection key={sec.id} section={sec} />
              ))}

              <div className="no-print mt-2 relative">
                <button
                  type="button"
                  onClick={() => setActiveAddSlot("sidebar")}
                  className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50/50 rounded text-[11px] text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>添加侧栏模块</span>
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};
