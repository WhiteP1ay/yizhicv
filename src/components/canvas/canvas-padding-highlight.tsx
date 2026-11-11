"use client";

import type React from "react";

interface CanvasPaddingHighlightProps {
  isVisible: boolean;
  paddingMm: number;
}

export const CanvasPaddingHighlight: React.FC<CanvasPaddingHighlightProps> = ({
  isVisible,
  paddingMm,
}) => {
  return (
    <div
      className={`no-print absolute inset-0 pointer-events-none transition-opacity duration-200 z-30 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{
        borderWidth: `${paddingMm}mm`,
        borderStyle: "solid",
        borderColor: "rgba(99, 102, 241, 0.22)",
      }}
    >
      {/* 内沿参考虚线与尺寸角标 */}
      <div className="w-full h-full border-2 border-dashed border-indigo-500/70 relative">
        <div className="absolute top-1.5 left-2 px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-mono shadow-md backdrop-blur-xs flex items-center gap-1.5 select-none">
          <span className="text-[10px] opacity-80">页面外边距</span>
          <span className="font-bold">{paddingMm}mm</span>
        </div>
      </div>
    </div>
  );
};
