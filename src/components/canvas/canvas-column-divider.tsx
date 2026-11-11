"use client";

import type React from "react";

interface CanvasColumnDividerProps {
  isResizing: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
}

export const CanvasColumnDivider: React.FC<CanvasColumnDividerProps> = ({
  isResizing,
  onPointerDown,
}) => {
  return (
    <div
      onPointerDown={onPointerDown}
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
            className={`w-0.5 h-2.5 rounded-full ${
              isResizing
                ? "bg-blue-500"
                : "bg-slate-400 group-hover:bg-blue-500"
            }`}
          />
          <span
            className={`w-0.5 h-2.5 rounded-full ${
              isResizing
                ? "bg-blue-500"
                : "bg-slate-400 group-hover:bg-blue-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
};
