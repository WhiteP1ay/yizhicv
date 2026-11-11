"use client";

import { type NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { Trash2 } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";

export const DividerNodeView: React.FC<NodeViewProps> = ({
  node,
  selected,
  deleteNode,
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

      {/* 选中态悬浮状态指示栏与快速删除手柄 (打印时隐藏) */}
      {selected && (
        <div className="no-print absolute -top-7 right-1 z-30 flex items-center gap-1.5 px-2 py-0.5 bg-slate-900/95 backdrop-blur-md text-white rounded-md shadow-lg text-[10px] animate-in fade-in duration-100">
          <span className="font-mono text-slate-300">
            {height}px · {color.toUpperCase()}
          </span>
          <div className="h-2.5 w-px bg-slate-700" />
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
            className="size-4 p-0 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
            title="删除分割线 (或按 Delete / Backspace 键)"
          >
            <Trash2 className="size-2.5" />
          </Button>
        </div>
      )}
    </NodeViewWrapper>
  );
};
