"use client";

import {
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type React from "react";
import { useCallback, useMemo } from "react";
import { useResumeTitle } from "@/hooks/use-resume-title";
import { useSidebarResize } from "@/hooks/use-sidebar-resize";
import { useResumeStore } from "@/store/resume";
import type { ResumeSection } from "@/types/resume";

export function useA4Canvas() {
  const {
    resume,
    isBlurMode,
    isPaddingHighlight,
    previewScale,
    setSidebarWidth,
    addDefaultSection,
    reorderSections,
  } = useResumeStore();

  const {
    title,
    titleInput,
    isEditing: isEditingTitle,
    setTitleInput: onTitleInputChange,
    startEditing: onStartEditingTitle,
    submitTitle: onTitleSubmit,
    handleKeyDown: onTitleKeyDown,
  } = useResumeTitle();

  const { isResizing, handlePointerDownResize } = useSidebarResize();

  const { layout, sections, design } = resume;
  const isSplitMode = layout.sidebarWidth > 0;

  // 模块按槽位分类过滤
  const sidebarSections = useMemo(
    () => sections.filter((s) => s.visible && s.slot === "sidebar"),
    [sections],
  );

  const mainSections = useMemo(
    () => sections.filter((s) => s.visible && s.slot === "main"),
    [sections],
  );

  const singleSections = useMemo(
    () => sections.filter((s) => s.visible),
    [sections],
  );

  // dnd-kit 传感器配置：移动 5px 激活，避免点击文本时误触拖拽
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  // 拖拽结束处理：支持同栏排序与跨栏穿梭
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      const oldIndex = sections.findIndex((s) => s.id === activeId);
      const newIndex = sections.findIndex((s) => s.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const targetSlot = sections[newIndex].slot;
        let updated: ResumeSection[] = [...sections];

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
    },
    [sections, reorderSections],
  );

  // 布局模式切换快捷方法
  const setSingleColumn = useCallback(() => {
    setSidebarWidth(0);
  }, [setSidebarWidth]);

  const setDoubleColumn = useCallback(() => {
    if (!isSplitMode) {
      setSidebarWidth(180);
    }
  }, [isSplitMode, setSidebarWidth]);

  // 添加模块快捷方法
  const handleAddSection = useCallback(
    (slot: "main" | "sidebar") => {
      return addDefaultSection(slot);
    },
    [addDefaultSection],
  );

  // 外层包裹缩放容器样式
  const containerStyle = useMemo<React.CSSProperties>(
    () => ({
      width: `${794 * previewScale}px`,
      minHeight: `${1123 * previewScale}px`,
    }),
    [previewScale],
  );

  // A4 物理画布样式
  const paperStyle = useMemo<React.CSSProperties>(
    () =>
      ({
        width: "794px",
        minHeight: "1123px",
        transform: `scale(${previewScale})`,
        transformOrigin: "top left",
        padding: `${design.pagePadding}mm`,
        fontSize: `${design.fontSize}pt`,
        lineHeight: design.lineHeight,
        color: "#1e293b",
        "--cv-theme": design.themeColor,
        "--cv-line-height": design.lineHeight,
        "--cv-gap": `${design.sectionGap}px`,
      }) as React.CSSProperties,
    [
      previewScale,
      design.pagePadding,
      design.fontSize,
      design.lineHeight,
      design.themeColor,
      design.sectionGap,
    ],
  );

  // 画布字体 class
  const paperFontClass = useMemo(() => {
    if (design.fontFamily === "serif") return "font-serif";
    if (design.fontFamily === "mono") return "font-mono";
    return "font-sans";
  }, [design.fontFamily]);

  return {
    resume,
    layout,
    sections,
    design,
    isSplitMode,
    isBlurMode,
    isPaddingHighlight,
    previewScale,
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
    // 标题编辑状态与动作
    title,
    titleInput,
    isEditingTitle,
    onTitleInputChange,
    onStartEditingTitle,
    onTitleSubmit,
    onTitleKeyDown,
  };
}
