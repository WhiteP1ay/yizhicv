"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useResumeStore } from "@/store/resume";
import { SECTION_PRESETS } from "@/types/resume";
import { EditableSection } from "./editable-section";

export const A4PaperCanvas: React.FC = () => {
  const {
    resume,
    isBlurMode,
    previewScale,
    setSidebarWidth,
    addSectionFromPreset,
    reorderSections,
  } = useResumeStore();

  const { layout, sections, design } = resume;
  const [activeAddSlot, setActiveAddSlot] = useState<"main" | "sidebar" | null>(
    null,
  );

  const isSplitMode = layout.sidebarWidth > 0;
  const sidebarSections = sections.filter(
    (s) => s.visible && s.slot === "sidebar",
  );
  const mainSections = sections.filter((s) => s.visible && s.slot === "main");

  // dnd-kit 传感器配置：移动 5px 激活，避免点击文本时误触拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // 拖拽结束处理：支持同栏排序与跨栏穿梭
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const oldIndex = sections.findIndex((s) => s.id === activeId);
    const newIndex = sections.findIndex((s) => s.id === overId);

    if (oldIndex !== -1 && newIndex !== -1) {
      const targetSlot = sections[newIndex].slot;
      let updated = [...sections];

      // 若跨槽位拖动，同步其 slot 属性
      if (updated[oldIndex].slot !== targetSlot) {
        updated[oldIndex] = {
          ...updated[oldIndex],
          slot: targetSlot,
        };
      }

      updated = arrayMove(updated, oldIndex, newIndex);
      reorderSections(updated);
    }
  };

  // 核心功能：直接按住中线左右拖拽改变侧栏宽度
  const handlePointerDownResize = (e: React.PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = layout.sidebarWidth || 180; // 若原本为 0 则基准按 180 开始拉

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = (moveEvent.clientX - startX) / previewScale;
      const nextWidth = startWidth + deltaX;

      // 磁吸阈值：拉到 70px 以内自动吸附为 0（纯单栏）
      if (nextWidth < 70) {
        setSidebarWidth(0);
      } else {
        const clamped = Math.min(380, Math.max(120, Math.round(nextWidth)));
        setSidebarWidth(clamped);
      }
    };

    const onPointerUp = () => {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

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

        {/* DndContext 拖拽提供者 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {isSplitMode ? (
            /* =================== 双栏模式 (Flex 容器 + 可拖拽中线) =================== */
            <div className="relative flex w-full min-h-full">
              {/* 1. 侧边栏槽位 */}
              <aside
                style={{ width: `${layout.sidebarWidth}px` }}
                className="flex-shrink-0 flex flex-col gap-[var(--cv-gap)] pr-4 relative min-w-0"
              >
                <SortableContext
                  items={sidebarSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sidebarSections.map((sec) => (
                    <EditableSection key={sec.id} section={sec} />
                  ))}
                </SortableContext>

                {/* 侧栏底部添加按钮 */}
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

              {/* 2. 可拖拽分界中线 (核心功能：拖拽该线直接微调侧栏宽度，拉至最左侧折叠) */}
              <div
                onPointerDown={handlePointerDownResize}
                className="no-print relative flex items-center justify-center cursor-col-resize group z-30 select-none -mx-2.5 px-2.5"
                title="按住左右拖拽调节侧栏宽度（拉到最左侧自动吸附为单栏）"
              >
                {/* 垂直分界线 */}
                <div className="w-[1px] h-full bg-slate-200 group-hover:bg-blue-500 group-active:bg-blue-600 group-hover:w-[2px] transition-all" />

                {/* 悬停时的双点把手指示 */}
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-6 bg-white border border-slate-300 rounded shadow-xs flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-2.5 bg-slate-400 rounded-full" />
                    <span className="w-0.5 h-2.5 bg-slate-400 rounded-full" />
                  </div>
                </div>
              </div>

              {/* 3. 主栏槽位 */}
              <main className="flex-1 flex flex-col gap-[var(--cv-gap)] pl-4 min-w-0">
                <SortableContext
                  items={mainSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {mainSections.map((sec) => (
                    <EditableSection key={sec.id} section={sec} />
                  ))}
                </SortableContext>

                {/* 主栏底部添加按钮 */}
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
            </div>
          ) : (
            /* =================== 单栏模式 (sidebarWidth === 0) =================== */
            <div className="relative w-full min-h-full">
              {/* 单栏模式下：左侧边缘隐藏一条轻巧的拉出把手 */}
              <div
                onPointerDown={handlePointerDownResize}
                className="no-print absolute top-0 bottom-0 -left-3 w-5 cursor-col-resize group z-30 flex items-center justify-center select-none"
                title="向右拖拽拉出侧边栏"
              >
                <div className="w-[2px] h-full bg-transparent group-hover:bg-blue-500/80 transition-colors" />
              </div>

              {/* 单栏文档流 */}
              <main className="w-full flex flex-col gap-[var(--cv-gap)]">
                <SortableContext
                  items={sections.filter((s) => s.visible).map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {sections
                    .filter((s) => s.visible)
                    .map((sec) => (
                      <EditableSection key={sec.id} section={sec} />
                    ))}
                </SortableContext>

                {/* 底部添加按钮 */}
                <div className="no-print mt-4 relative">
                  <button
                    type="button"
                    onClick={() => setActiveAddSlot("main")}
                    className="w-full py-2.5 border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50/60 rounded-md text-xs text-slate-400 hover:text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>在此处添加新模块</span>
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
            </div>
          )}
        </DndContext>
      </div>
    </div>
  );
};
