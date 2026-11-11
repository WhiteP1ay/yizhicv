"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import type { ResumeSection } from "@/types/resume";
import { CanvasAddSectionButton } from "./canvas-add-section-button";
import { CanvasColumnDivider } from "./canvas-column-divider";
import { EditableSection } from "./editable-section";

interface CanvasSplitLayoutProps {
  sidebarWidth: number;
  sidebarSections: ResumeSection[];
  mainSections: ResumeSection[];
  isResizing: boolean;
  onResizePointerDown: (e: React.PointerEvent) => void;
  onAddSection: (slot: "main" | "sidebar") => void;
}

export const CanvasSplitLayout: React.FC<CanvasSplitLayoutProps> = ({
  sidebarWidth,
  sidebarSections,
  mainSections,
  isResizing,
  onResizePointerDown,
  onAddSection,
}) => {
  return (
    <div className="relative flex w-full min-h-full">
      {/* 1. 侧边栏槽位 */}
      <aside
        style={{ width: `${sidebarWidth}px` }}
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

        <CanvasAddSectionButton slot="sidebar" onAdd={onAddSection} />
      </aside>

      {/* 2. 可拖拽分界中线 */}
      <CanvasColumnDivider
        isResizing={isResizing}
        onPointerDown={onResizePointerDown}
      />

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

        <CanvasAddSectionButton slot="main" onAdd={onAddSection} />
      </main>
    </div>
  );
};
