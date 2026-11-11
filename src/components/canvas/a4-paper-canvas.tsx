"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import type React from "react";
import { useA4Canvas } from "@/hooks/use-a4-canvas";
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
      >
        {/* 画布核心排版层级与主题色彩内联样式引擎 (杜绝 Turbopack 外部 CSS 缓存失效问题) */}
        <style>{`
          #cv-print-target h1,
          #cv-print-target .cv-inline-editor h1 {
            font-size: 2em !important;
            font-weight: 700 !important;
            line-height: 1.25 !important;
            letter-spacing: -0.02em !important;
            color: var(--cv-theme, #0f172a) !important;
            margin-top: 0.35em !important;
            margin-bottom: 0.25em !important;
          }

          #cv-print-target h2,
          #cv-print-target .cv-inline-editor h2 {
            font-size: 1.35em !important;
            font-weight: 700 !important;
            line-height: 1.35 !important;
            letter-spacing: -0.01em !important;
            color: var(--cv-theme, #0f172a) !important;
            margin-top: 0.5em !important;
            margin-bottom: 0.35em !important;
            border-bottom: 1px solid color-mix(in srgb, var(--cv-theme, #0f172a) 25%, #e2e8f0) !important;
            padding-bottom: 0.25em !important;
          }

          #cv-print-target h3,
          #cv-print-target .cv-inline-editor h3 {
            font-size: 1.15em !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
            color: var(--cv-theme, #0f172a) !important;
            margin-top: 0.4em !important;
            margin-bottom: 0.2em !important;
          }

          #cv-print-target .cv-entry .flex h1,
          #cv-print-target .cv-entry .flex h2,
          #cv-print-target .cv-entry .flex h3,
          #cv-print-target .justify-between h1,
          #cv-print-target .justify-between h2,
          #cv-print-target .justify-between h3 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            border-bottom: none !important;
            padding-bottom: 0 !important;
          }

          #cv-print-target h1.border-b,
          #cv-print-target h2.border-b,
          #cv-print-target h3.border-b,
          #cv-print-target .cv-inline-editor h1.border-b,
          #cv-print-target .cv-inline-editor h2.border-b,
          #cv-print-target .cv-inline-editor h3.border-b {
            border-bottom: 1px solid color-mix(in srgb, var(--cv-theme, #0f172a) 25%, #e2e8f0) !important;
          }

          #cv-print-target p,
          #cv-print-target .cv-inline-editor p {
            font-size: 1em !important;
            margin-top: 0 !important;
            margin-bottom: 0.35em !important;
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
      </div>
    </div>
  );
};
