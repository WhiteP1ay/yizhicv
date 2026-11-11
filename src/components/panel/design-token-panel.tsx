"use client";

import { Minus, Plus, RotateCcw, Sliders, Type } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume";
import { TextInspector } from "./text-inspector";

const FONT_OPTIONS: Array<{
  key: "sans" | "serif" | "mono";
  label: string;
  sub: string;
  sample: string;
}> = [
  { key: "sans", label: "无衬线", sub: "黑体", sample: "Aa" },
  { key: "serif", label: "衬线体", sub: "宋体", sample: "Aa" },
  { key: "mono", label: "等宽体", sub: "代码", sample: "Aa" },
];

export const DesignTokenPanel: React.FC = () => {
  const {
    resume,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setSectionGap,
    setPagePadding,
    setIsPaddingHighlight,
    resetDesign,
  } = useResumeStore();

  const { design } = resume;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-xs text-slate-700 select-none">
      {/* 1. 选中文本与排版控制 (实时响应光标选区) */}
      <TextInspector />

      {/* 2. 页面与排版全局版面设置 */}
      <div className="pt-1 border-t border-slate-200/80 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Sliders className="size-3.5 text-slate-500" />
          <span>版面与基准设置</span>
        </div>

        {/* 字体族群 */}
        <section className="space-y-2">
          <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
            <Type className="size-3 text-slate-400" />
            <span>字体族群</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
            {FONT_OPTIONS.map((f) => {
              const isSelected = design.fontFamily === f.key;
              return (
                <Button
                  key={f.key}
                  type="button"
                  variant="ghost"
                  onClick={() => setFontFamily(f.key)}
                  className={`h-auto py-1.5 px-2 flex flex-col items-center justify-center rounded-md transition-all ${
                    isSelected
                      ? "bg-white text-slate-900 shadow-xs font-medium"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      f.key === "serif"
                        ? "font-serif"
                        : f.key === "mono"
                          ? "font-mono"
                          : "font-sans"
                    }`}
                  >
                    {f.sample}
                  </span>
                  <span className="text-[10px] mt-0.5">{f.label}</span>
                </Button>
              );
            })}
          </div>
        </section>

        {/* 3. 设计排版数值 Token */}
        <section className="space-y-4 pt-1 border-t border-slate-100">
          {/* 字号大小 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">正文字号</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {design.fontSize} pt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setFontSize(
                    Math.max(9, Number((design.fontSize - 0.5).toFixed(1))),
                  )
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="减小字号"
              >
                <Minus className="size-3" />
              </Button>
              <input
                type="range"
                min="9"
                max="13"
                step="0.5"
                value={design.fontSize}
                onChange={(e) => setFontSize(Number.parseFloat(e.target.value))}
                onInput={(e) =>
                  setFontSize(Number.parseFloat(e.currentTarget.value))
                }
                className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setFontSize(
                    Math.min(13, Number((design.fontSize + 0.5).toFixed(1))),
                  )
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="增大字号"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {/* 行高比例 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">行高间距</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {design.lineHeight}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setLineHeight(
                    Math.max(
                      1.0,
                      Number((design.lineHeight - 0.05).toFixed(2)),
                    ),
                  )
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="减小行高"
              >
                <Minus className="size-3" />
              </Button>
              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.05"
                value={design.lineHeight}
                onChange={(e) =>
                  setLineHeight(Number.parseFloat(e.target.value))
                }
                onInput={(e) =>
                  setLineHeight(Number.parseFloat(e.currentTarget.value))
                }
                className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setLineHeight(
                    Math.min(
                      2.2,
                      Number((design.lineHeight + 0.05).toFixed(2)),
                    ),
                  )
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="增大行高"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {/* 模块间距 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">模块间隙</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {design.sectionGap} px
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setSectionGap(Math.max(0, design.sectionGap - 2))
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="紧凑模块"
              >
                <Minus className="size-3" />
              </Button>
              <input
                type="range"
                min="0"
                max="32"
                step="2"
                value={design.sectionGap}
                onChange={(e) =>
                  setSectionGap(Number.parseInt(e.target.value, 10))
                }
                onInput={(e) =>
                  setSectionGap(Number.parseInt(e.currentTarget.value, 10))
                }
                className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setSectionGap(Math.min(32, design.sectionGap + 2))
                }
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="宽松模块"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {/* 页面边距 (调节或悬停时画布高亮外间距范围) */}
          <div
            onMouseEnter={() => setIsPaddingHighlight(true)}
            onMouseLeave={() => setIsPaddingHighlight(false)}
            className="space-y-1.5 p-1.5 -mx-1.5 rounded-lg transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">页面外边距</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {design.pagePadding} mm
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setPagePadding(Math.max(0, design.pagePadding - 1))
                }
                onMouseEnter={() => setIsPaddingHighlight(true)}
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="减小边距"
              >
                <Minus className="size-3" />
              </Button>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={design.pagePadding}
                onChange={(e) =>
                  setPagePadding(Number.parseInt(e.target.value, 10))
                }
                onInput={(e) =>
                  setPagePadding(Number.parseInt(e.currentTarget.value, 10))
                }
                onPointerDown={() => setIsPaddingHighlight(true)}
                onPointerUp={() => setIsPaddingHighlight(false)}
                onFocus={() => setIsPaddingHighlight(true)}
                onBlur={() => setIsPaddingHighlight(false)}
                onTouchStart={() => setIsPaddingHighlight(true)}
                onTouchEnd={() => setIsPaddingHighlight(false)}
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setPagePadding(Math.min(24, design.pagePadding + 1))
                }
                onMouseEnter={() => setIsPaddingHighlight(true)}
                className="size-6 rounded text-slate-500 hover:text-slate-800"
                title="增大边距"
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* 3. 底部重置操作 */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={resetDesign}
          className="w-full h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 rounded-lg border-slate-200"
        >
          <RotateCcw className="size-3 text-slate-400" />
          <span>恢复默认样式规范</span>
        </Button>
      </div>
    </div>
  );
};
