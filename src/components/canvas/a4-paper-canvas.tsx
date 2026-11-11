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
        {/* 画布基础排版与分割线规则 (不锁死颜色与边框，由右侧面板自由排版) */}
        <style>{`
          #cv-print-target h1,
          #cv-print-target .cv-inline-editor h1 {
            font-size: 1.75em;
            font-weight: 700;
            line-height: 1.25;
            letter-spacing: -0.02em;
            margin-top: 0.35em;
            margin-bottom: 0.25em;
          }

          #cv-print-target h2,
          #cv-print-target .cv-inline-editor h2 {
            font-size: 1.25em;
            font-weight: 700;
            line-height: 1.35;
            letter-spacing: -0.01em;
            margin-top: 0.45em;
            margin-bottom: 0.3em;
          }

          #cv-print-target h3,
          #cv-print-target .cv-inline-editor h3 {
            font-size: 1.1em;
            font-weight: 600;
            line-height: 1.4;
            margin-top: 0.35em;
            margin-bottom: 0.2em;
          }

          #cv-print-target .cv-entry .flex h1,
          #cv-print-target .cv-entry .flex h2,
          #cv-print-target .cv-entry .flex h3,
          #cv-print-target .justify-between h1,
          #cv-print-target .justify-between h2,
          #cv-print-target .justify-between h3 {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
          }

          #cv-print-target p,
          #cv-print-target .cv-inline-editor p {
            font-size: 1em;
            margin-top: 0;
            margin-bottom: 0.35em;
          }

          #cv-print-target hr {
            border: none !important;
            border-top: 1px solid #e2e8f0 !important;
            margin: 0.6em 0 !important;
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
