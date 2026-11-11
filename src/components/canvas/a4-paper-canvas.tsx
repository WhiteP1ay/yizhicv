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
import { Columns2, Pencil, Plus, RectangleVertical } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useResumeTitle } from "@/hooks/use-resume-title";
import { useSidebarResize } from "@/hooks/use-sidebar-resize";
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

  const {
    title,
    titleInput,
    isEditing: isEditingTitle,
    setTitleInput,
    startEditing: startEditingTitle,
    submitTitle: handleTitleSubmit,
    handleKeyDown: handleTitleKeyDown,
  } = useResumeTitle();

  const { isResizing, handlePointerDownResize } = useSidebarResize();

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

  return (
    <div
      style={{
        width: `${794 * previewScale}px`,
        minHeight: `${1123 * previewScale}px`,
      }}
      className="transition-all duration-150 ease-out flex-shrink-0"
    >
      {/* 纸张外顶部操作栏：左侧文件名，右侧单双列布局切换器 */}
      <div className="no-print flex items-center justify-between pb-2 px-1 select-none">
        {/* 左侧：文件名编辑 */}
        <div className="flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={handleTitleKeyDown}
              className="h-7 text-xs font-semibold text-slate-800 bg-white px-2.5 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 shadow-2xs"
              autoFocus
            />
          ) : (
            <Button
              type="button"
              variant="ghost"
              onClick={startEditingTitle}
              className="group h-7 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 px-2 rounded-md transition-colors"
              title="点击重命名简历"
            >
              <span>{title}</span>
              <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </Button>
          )}
        </div>

        {/* 右侧：单双列布局切换器 */}
        <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSidebarWidth(0)}
            className={`h-6 px-2.5 text-[11px] font-medium rounded-md gap-1 transition-all ${
              !isSplitMode
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
            title="单列文档流布局"
          >
            <RectangleVertical className="w-3 h-3" />
            <span>单列</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (!isSplitMode) {
                setSidebarWidth(180);
              }
            }}
            className={`h-6 px-2.5 text-[11px] font-medium rounded-md gap-1 transition-all ${
              isSplitMode
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
            }`}
            title="双栏侧边栏布局"
          >
            <Columns2 className="w-3 h-3" />
            <span>双列</span>
          </Button>
        </div>
      </div>

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

                {/* 侧栏底部添加按钮 (永远保持水平居中) */}
                <div className="no-print mt-3 flex justify-center items-center w-full relative">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveAddSlot("sidebar")}
                    className="w-full h-auto py-2 border-dashed border-slate-300 text-slate-400 hover:border-slate-400 hover:bg-slate-50/50 hover:text-slate-600 text-[11px] gap-1.5 shadow-none transition-all flex items-center justify-center text-center"
                  >
                    <Plus className="size-3" />
                    <span>添加侧栏模块</span>
                  </Button>

                  {activeAddSlot === "sidebar" && (
                    <>
                      <div
                        role="presentation"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setActiveAddSlot(null)}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          添加预设至侧栏
                        </div>
                        {Object.values(SECTION_PRESETS).map((p) => (
                          <Button
                            key={p.key}
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              addSectionFromPreset(p.key, "sidebar");
                              setActiveAddSlot(null);
                            }}
                            className="w-full h-8 px-3 hover:bg-slate-50 text-xs text-slate-700 justify-start font-normal rounded-md"
                          >
                            {p.name}
                          </Button>
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
                {/* 垂直分界线：显眼且清晰的高对比度中线 */}
                <div
                  className={`h-full transition-all ${
                    isResizing
                      ? "w-[2px] bg-blue-600 shadow-xs"
                      : "w-[1.5px] bg-slate-300 group-hover:bg-blue-500 group-active:bg-blue-600 group-hover:w-[2px]"
                  }`}
                />

                {/* 常驻微显的手势中线把手指示（即便不悬停也清晰可见） */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-6 bg-white border rounded shadow-xs flex items-center justify-center transition-all ${
                    isResizing
                      ? "opacity-100 border-blue-500 shadow-md scale-105"
                      : "opacity-60 group-hover:opacity-100 group-hover:border-blue-400 group-hover:scale-105 border-slate-300"
                  }`}
                >
                  <div className="flex gap-0.5">
                    <span
                      className={`w-0.5 h-2.5 rounded-full ${isResizing ? "bg-blue-500" : "bg-slate-400 group-hover:bg-blue-500"}`}
                    />
                    <span
                      className={`w-0.5 h-2.5 rounded-full ${isResizing ? "bg-blue-500" : "bg-slate-400 group-hover:bg-blue-500"}`}
                    />
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveAddSlot("main")}
                    className="w-full h-auto py-2.5 border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:bg-slate-50/60 hover:text-slate-700 text-xs gap-1.5 shadow-none transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>在此处添加新模块 (经历 / 作品 / 技能)</span>
                  </Button>

                  {activeAddSlot === "main" && (
                    <>
                      <div
                        role="presentation"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setActiveAddSlot(null)}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          添加预设模块
                        </div>
                        {Object.values(SECTION_PRESETS).map((p) => (
                          <Button
                            key={p.key}
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              addSectionFromPreset(p.key, "main");
                              setActiveAddSlot(null);
                            }}
                            className="w-full h-auto px-3 py-2 hover:bg-slate-50 flex flex-col items-start text-left justify-start transition-colors rounded-md"
                          >
                            <span className="text-xs font-medium text-slate-800">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.description}
                            </span>
                          </Button>
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveAddSlot("main")}
                    className="w-full h-auto py-2.5 border-dashed border-slate-300 text-slate-400 hover:border-slate-500 hover:bg-slate-50/60 hover:text-slate-700 text-xs gap-1.5 shadow-none transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>在此处添加新模块</span>
                  </Button>

                  {activeAddSlot === "main" && (
                    <>
                      <div
                        role="presentation"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setActiveAddSlot(null)}
                      />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                        <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                          添加预设模块
                        </div>
                        {Object.values(SECTION_PRESETS).map((p) => (
                          <Button
                            key={p.key}
                            type="button"
                            variant="ghost"
                            onClick={() => {
                              addSectionFromPreset(p.key, "main");
                              setActiveAddSlot(null);
                            }}
                            className="w-full h-auto px-3 py-2 hover:bg-slate-50 flex flex-col items-start text-left justify-start transition-colors rounded-md"
                          >
                            <span className="text-xs font-medium text-slate-800">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {p.description}
                            </span>
                          </Button>
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
