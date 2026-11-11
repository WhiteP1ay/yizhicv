"use client";

import type React from "react";
import { DividerInspector } from "./divider-inspector";

export const InsertPanel: React.FC = () => {
  return (
    <div
      data-testid="insert-panel"
      className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs text-slate-700 select-none"
    >
      {/* 分割线插入与二次编辑区块 */}
      <DividerInspector />
    </div>
  );
};
