"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type React from "react";

export const DividerNodeView: React.FC<NodeViewProps> = ({
  node,
  selected,
  editor,
  getPos,
}) => {
  const height = (node.attrs.height as number) || 1;
  const color = (node.attrs.color as string) || "#e2e8f0";

  const handleSelect = (e?: React.SyntheticEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (typeof getPos === "function") {
      const pos = getPos();
      if (typeof pos === "number") {
        editor.chain().setNodeSelection(pos).focus().run();
      }
    }
  };

  return (
    <NodeViewWrapper
      className="cv-divider-node-view relative select-none my-1.5 transition-all group print:my-2"
      data-selected={selected ? "true" : undefined}
    >
      {/* 交互点击与悬停热区 (提供 12px 舒适高度，避免 1px 细线点不中) */}
      <button
        type="button"
        onClick={handleSelect}
        onPointerDown={(e) => {
          e.stopPropagation();
          handleSelect(e);
        }}
        className={`w-full block py-1.5 px-1 rounded-sm cursor-pointer transition-all relative border-none bg-transparent outline-none focus:outline-none print:py-0 print:px-0 ${
          selected
            ? "ring-2 ring-blue-500 bg-blue-50/25 shadow-2xs print:ring-0 print:bg-transparent"
            : "hover:bg-slate-200/50 print:hover:bg-transparent"
        }`}
        title="点击选中此分割线，可在右侧面板二次编辑高度与颜色"
      >
        {/* 真实的水平线条 */}
        <span
          style={{
            borderTopWidth: `${height}px`,
            borderTopColor: color,
            borderTopStyle: "solid",
          }}
          className="w-full block transition-all duration-150 pointer-events-none"
        />
      </button>
    </NodeViewWrapper>
  );
};
