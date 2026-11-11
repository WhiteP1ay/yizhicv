"use client";

import {
  Check,
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Type,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";

export const EditorTopToolbar: React.FC = () => {
  const { headingState, toggleHeading, setParagraph } = useActiveEditorStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 监听外部点击与 Esc 键收起下拉菜单
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  // 当前激活的样式名称与图标
  const currentLabel = headingState.isH1
    ? "一级标题"
    : headingState.isH2
      ? "二级标题"
      : headingState.isH3
        ? "三级标题"
        : "正文";

  return (
    <div
      className="flex items-center gap-1 select-none"
      role="toolbar"
      aria-label="富文本格式工具栏"
    >
      {/* 标题样式选择下拉菜单 */}
      <div className="relative flex items-center" ref={dropdownRef}>
        <Button
          type="button"
          variant="ghost"
          onPointerDown={(e) => {
            // 阻止偷焦，确保富文本光标不丢失
            e.preventDefault();
          }}
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={`h-7 px-2.5 text-xs font-medium rounded-md gap-1 transition-colors ${
            isDropdownOpen
              ? "bg-slate-200 text-slate-900"
              : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
          }`}
          title="切换段落或标题格式"
        >
          <span>{currentLabel}</span>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform duration-100" />
        </Button>

        {isDropdownOpen && (
          <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
            {/* 正文 */}
            <Button
              type="button"
              variant="ghost"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                setParagraph();
                setIsDropdownOpen(false);
              }}
              className="w-full h-9 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                <div className="text-left">
                  <div className="font-medium">正文</div>
                  <div className="text-[10px] text-slate-400">普通文本段落</div>
                </div>
              </div>
              {headingState.isParagraph && (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </Button>

            <div className="h-px bg-slate-100 my-1" />

            {/* 一级标题 */}
            <Button
              type="button"
              variant="ghost"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                toggleHeading(1);
                setIsDropdownOpen(false);
              }}
              className="w-full h-9 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Heading1 className="w-3.5 h-3.5 text-slate-700" />
                <div className="text-left">
                  <div className="font-medium">一级标题 (H1)</div>
                  <div className="text-[10px] text-slate-400">
                    主标题 / 姓名 / 核心定位
                  </div>
                </div>
              </div>
              {headingState.isH1 && (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </Button>

            {/* 二级标题 */}
            <Button
              type="button"
              variant="ghost"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                toggleHeading(2);
                setIsDropdownOpen(false);
              }}
              className="w-full h-9 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Heading2 className="w-3.5 h-3.5 text-slate-700" />
                <div className="text-left">
                  <div className="font-medium">二级标题 (H2)</div>
                  <div className="text-[10px] text-slate-400">
                    模块大标题 (经历 / 教育 / 作品)
                  </div>
                </div>
              </div>
              {headingState.isH2 && (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </Button>

            {/* 三级标题 */}
            <Button
              type="button"
              variant="ghost"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => {
                toggleHeading(3);
                setIsDropdownOpen(false);
              }}
              className="w-full h-9 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
            >
              <div className="flex items-center gap-2">
                <Heading3 className="w-3.5 h-3.5 text-slate-700" />
                <div className="text-left">
                  <div className="font-medium">三级标题 (H3)</div>
                  <div className="text-[10px] text-slate-400">
                    子标题 (岗位 / 公司 / 项目名)
                  </div>
                </div>
              </div>
              {headingState.isH3 && (
                <Check className="w-3.5 h-3.5 text-blue-600" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* 快捷标题切换按钮 (H1 / H2 / H3) */}
      <div className="flex items-center gap-0.5 bg-slate-100/70 p-0.5 rounded-md border border-slate-200/60">
        {/* H1 快速切换 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => toggleHeading(1)}
          className={`h-6 w-6 rounded text-xs transition-colors ${
            headingState.isH1
              ? "bg-white text-slate-900 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="一级标题 (H1: 主标题 / 姓名)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </Button>

        {/* H2 快速切换 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => toggleHeading(2)}
          className={`h-6 w-6 rounded text-xs transition-colors ${
            headingState.isH2
              ? "bg-white text-slate-900 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="二级标题 (H2: 模块大标题)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </Button>

        {/* H3 快速切换 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onPointerDown={(e) => e.preventDefault()}
          onClick={() => toggleHeading(3)}
          className={`h-6 w-6 rounded text-xs transition-colors ${
            headingState.isH3
              ? "bg-white text-slate-900 font-semibold shadow-2xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
          title="三级标题 (H3: 岗位 / 公司 / 项目)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};
