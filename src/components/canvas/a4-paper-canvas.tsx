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
