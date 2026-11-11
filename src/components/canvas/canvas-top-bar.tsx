"use client";

import { Columns2, Pencil, RectangleVertical } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface CanvasTopBarProps {
  title: string;
  titleInput: string;
  isEditingTitle: boolean;
  onTitleInputChange: (value: string) => void;
  onStartEditingTitle: () => void;
  onTitleSubmit: () => void;
  onTitleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isSplitMode: boolean;
  onSetSingleColumn: () => void;
  onSetDoubleColumn: () => void;
}

export const CanvasTopBar: React.FC<CanvasTopBarProps> = ({
  title,
  titleInput,
  isEditingTitle,
  onTitleInputChange,
  onStartEditingTitle,
  onTitleSubmit,
  onTitleKeyDown,
  isSplitMode,
  onSetSingleColumn,
  onSetDoubleColumn,
}) => {
  return (
    <div className="no-print flex items-center justify-between pb-2 px-1 select-none">
      {/* 左侧：文件名编辑 */}
      <div className="flex items-center">
        {isEditingTitle ? (
          <input
            type="text"
            value={titleInput}
            onChange={(e) => onTitleInputChange(e.target.value)}
            onBlur={onTitleSubmit}
            onKeyDown={onTitleKeyDown}
            className="h-7 text-xs font-semibold text-slate-800 bg-white px-2.5 rounded border border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-48 shadow-2xs"
            autoFocus
          />
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={onStartEditingTitle}
            className="group h-7 flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 px-2 rounded-md transition-colors"
            title="点击重命名简历"
          >
            <span>{title}</span>
            <Pencil className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </Button>
        )}
      </div>

      {/* 右侧：单双列布局切换器 */}
      <ToggleGroup
        value={[isSplitMode ? "double" : "single"]}
        onValueChange={(val) => {
          if (val.includes("single") && isSplitMode) {
            onSetSingleColumn();
          } else if (val.includes("double") && !isSplitMode) {
            onSetDoubleColumn();
          }
        }}
        className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs gap-0.5"
      >
        <ToggleGroupItem
          value="single"
          className="h-6 px-2.5 text-[11px] font-medium rounded-md gap-1 data-pressed:bg-white data-pressed:text-slate-900 data-pressed:shadow-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 cursor-pointer"
          title="单列文档流布局"
        >
          <RectangleVertical className="w-3 h-3" />
          <span>单列</span>
        </ToggleGroupItem>
        <ToggleGroupItem
          value="double"
          className="h-6 px-2.5 text-[11px] font-medium rounded-md gap-1 data-pressed:bg-white data-pressed:text-slate-900 data-pressed:shadow-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 cursor-pointer"
          title="双栏侧边栏布局"
        >
          <Columns2 className="w-3 h-3" />
          <span>双列</span>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
