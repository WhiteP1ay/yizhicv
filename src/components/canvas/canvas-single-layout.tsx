"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type React from "react";
import type { ResumeSection } from "@/types/resume";
import { CanvasAddSectionButton } from "./canvas-add-section-button";
import { EditableSection } from "./editable-section";

interface CanvasSingleLayoutProps {
  sections: ResumeSection[];
  onAddSection: (slot: "main" | "sidebar") => void;
}

export const CanvasSingleLayout: React.FC<CanvasSingleLayoutProps> = ({
  sections,
  onAddSection,
}) => {
  return (
    <div className="relative w-full min-h-full">
      <main className="w-full flex flex-col gap-[var(--cv-gap)]">
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {sections.map((sec) => (
            <EditableSection key={sec.id} section={sec} />
          ))}
        </SortableContext>

        <CanvasAddSectionButton slot="main" onAdd={onAddSection} />
      </main>
    </div>
  );
};
