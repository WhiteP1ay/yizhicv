"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import { nanoid } from "nanoid";
import type React from "react";
import { useCallback } from "react";
import { useA4Canvas } from "@/hooks/use-a4-canvas";
import { useCanvasImagesStore } from "@/store/canvas-images";
import type { ImageSlot } from "@/types/resume";
import { CanvasImageLayer } from "./canvas-image-layer";
import { CanvasPaddingHighlight } from "./canvas-padding-highlight";
import { CanvasSingleLayout } from "./canvas-single-layout";
import { CanvasSplitLayout } from "./canvas-split-layout";
import { CanvasTopBar } from "./canvas-top-bar";

export const A4PaperCanvas: React.FC = () => {
  const {
    title,
    titleInput,
    isEditingTitle,
    onTitleInputChange,
    onStartEditingTitle,
    onTitleSubmit,
    onTitleKeyDown,
    isSplitMode,
    isBlurMode,
    isPaddingHighlight,
    layout,
    design,
    sidebarSections,
    mainSections,
    singleSections,
    sensors,
    handleDragEnd,
    setSingleColumn,
    setDoubleColumn,
    handleAddSection,
    isResizing,
    handlePointerDownResize,
    containerStyle,
    paperStyle,
    paperFontClass,
  } = useA4Canvas();

  const { addItem } = useCanvasImagesStore();

  // 接收从插槽面板拖来的图片
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/yizhicv-image-slot");
      if (!raw) return;

      let slot: ImageSlot;
      try {
        slot = JSON.parse(raw) as ImageSlot;
      } catch {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - 50);
      const y = Math.max(0, e.clientY - rect.top - 50);

      addItem({
        id: `cimg_${nanoid(6)}`,
        slot,
        x,
        y,
        width: 100,
        height: 100,
      });
    },
    [addItem],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("application/yizhicv-image-slot")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  return (
    <div
      style={containerStyle}
      className="transition-all duration-150 ease-out flex-shrink-0"
    >
      {/* 纸张外顶部操作栏：左侧文件名编辑，右侧单双列布局切换器 */}
      <CanvasTopBar
        title={title}
        titleInput={titleInput}
        isEditingTitle={isEditingTitle}
        onTitleInputChange={onTitleInputChange}
        onStartEditingTitle={onStartEditingTitle}
        onTitleSubmit={onTitleSubmit}
        onTitleKeyDown={onTitleKeyDown}
        isSplitMode={isSplitMode}
        onSetSingleColumn={setSingleColumn}
        onSetDoubleColumn={setDoubleColumn}
      />

      {/* 真实 A4 物理比例纸张 (794px × 1123px) */}
      <div
        id="cv-print-target"
        className={`cv-page-a4 bg-white shadow-2xl transition-shadow duration-300 relative ${
          isBlurMode ? "cv-preview-blur" : ""
        } ${paperFontClass}`}
        style={paperStyle}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* 画布基础排版与分割线规则 (标题绝不自带分割线，分割线支持自由高度与色彩) */}
        <style>{`
          #cv-print-target h1,
          #cv-print-target .cv-inline-editor h1 {
            font-size: 1.75em;
            font-weight: 700;
            line-height: 1.25;
            letter-spacing: -0.02em;
            margin-top: 0.35em;
            margin-bottom: 0.25em;
            border: none !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }

          #cv-print-target h2,
          #cv-print-target .cv-inline-editor h2 {
            font-size: 1.25em;
            font-weight: 700;
            line-height: 1.35;
            letter-spacing: -0.01em;
            margin-top: 0.45em;
            margin-bottom: 0.3em;
            border: none !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }

          #cv-print-target h3,
          #cv-print-target .cv-inline-editor h3 {
            font-size: 1.1em;
            font-weight: 600;
            line-height: 1.4;
            margin-top: 0.35em;
            margin-bottom: 0.2em;
            border: none !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }

          #cv-print-target .cv-entry .flex h1,
          #cv-print-target .cv-entry .flex h2,
          #cv-print-target .cv-entry .flex h3,
          #cv-print-target .justify-between h1,
          #cv-print-target .justify-between h2,
          #cv-print-target .justify-between h3 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            border: none !important;
            border-bottom: none !important;
          }

          #cv-print-target p,
          #cv-print-target .cv-inline-editor p {
            font-size: 1em;
            margin-top: 0;
            margin-bottom: 0.35em;
          }

          #cv-print-target hr {
            border: none;
            border-top-style: solid;
            margin: 0.6em 0;
          }
        `}</style>

        {/* 用户自定 CSS 钩子 */}
        {design.customCss && <style>{design.customCss}</style>}

        {/* 页面外边距动态辅助参考高亮层 */}
        <CanvasPaddingHighlight
          isVisible={isPaddingHighlight}
          paddingMm={design.pagePadding}
        />

        {/* 模块拖拽编排提供者 */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {isSplitMode ? (
            <CanvasSplitLayout
              sidebarWidth={layout.sidebarWidth}
              sidebarSections={sidebarSections}
              mainSections={mainSections}
              isResizing={isResizing}
              onResizePointerDown={handlePointerDownResize}
              onAddSection={handleAddSection}
            />
          ) : (
            <CanvasSingleLayout
              sections={singleSections}
              onAddSection={handleAddSection}
            />
          )}
        </DndContext>

        {/* 画布浮动图片层（拖拽放置、自由定位、可拖移） */}
        <CanvasImageLayer />
      </div>
    </div>
  );
};
