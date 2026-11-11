"use client";

import { Check, Minus, Pipette, Plus, RotateCcw, Type } from "lucide-react";
import type React from "react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume";

const PRESET_COLORS = [
  { name: "曜石黑", value: "#0f172a" },
  { name: "经典蓝", value: "#1e3a8a" },
  { name: "墨黛青", value: "#0e7490" },
  { name: "森雅绿", value: "#047857" },
  { name: "勃艮第", value: "#991b1b" },
  { name: "罗兰紫", value: "#6b21a8" },
  { name: "冷石灰", value: "#334155" },
];

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
    setThemeColor,
    setFontFamily,
    setFontSize,
    setLineHeight,
    setSectionGap,
    setPagePadding,
    resetDesign,
  } = useResumeStore();

  const { design } = resume;
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 text-xs text-slate-700 select-none">
      {/* 1. 主题色彩 */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-800">主题色彩</div>
          <span className="text-[11px] font-mono text-slate-400 uppercase">
            {design.themeColor}
          </span>
        </div>

        {/* 经典预设色盘 + 自定义取色器 */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESET_COLORS.map((c) => {
            const isSelected =
              design.themeColor.toLowerCase() === c.value.toLowerCase();
            return (
              <Button
                key={c.value}
                type="button"
                variant="ghost"
                onClick={() => setThemeColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`size-6 rounded-full p-0 relative transition-transform hover:scale-110 shadow-2xs border ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-2 scale-105"
                    : "border-black/10"
                }`}
                title={`${c.name} (${c.value})`}
              >
                {isSelected && (
                  <Check className="size-3 text-white stroke-[2.5]" />
                )}
              </Button>
            );
          })}

          {/* 自定义颜色吸管/弹窗 */}
          <div className="relative">
            <input
              ref={colorInputRef}
              type="color"
              value={design.themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => colorInputRef.current?.click()}
              className="size-6 rounded-full border-dashed border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors"
              title="自定义拾色器"
            >
              <Pipette className="size-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* 2. 字体族群 */}
      <section className="space-y-2.5">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Type className="size-3.5 text-slate-500" />
          <span>正文字体</span>
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
                  Math.max(1.2, Number((design.lineHeight - 0.05).toFixed(2))),
                )
              }
              className="size-6 rounded text-slate-500 hover:text-slate-800"
              title="减小行高"
            >
              <Minus className="size-3" />
            </Button>
            <input
              type="range"
              min="1.2"
              max="1.8"
              step="0.05"
              value={design.lineHeight}
              onChange={(e) => setLineHeight(Number.parseFloat(e.target.value))}
              className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() =>
                setLineHeight(
                  Math.min(1.8, Number((design.lineHeight + 0.05).toFixed(2))),
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
              onClick={() => setSectionGap(Math.max(8, design.sectionGap - 2))}
              className="size-6 rounded text-slate-500 hover:text-slate-800"
              title="紧凑模块"
            >
              <Minus className="size-3" />
            </Button>
            <input
              type="range"
              min="8"
              max="32"
              step="2"
              value={design.sectionGap}
              onChange={(e) =>
                setSectionGap(Number.parseInt(e.target.value, 10))
              }
              className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setSectionGap(Math.min(32, design.sectionGap + 2))}
              className="size-6 rounded text-slate-500 hover:text-slate-800"
              title="宽松模块"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>

        {/* 页面边距 */}
        <div className="space-y-1.5">
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
                setPagePadding(Math.max(10, design.pagePadding - 1))
              }
              className="size-6 rounded text-slate-500 hover:text-slate-800"
              title="减小边距"
            >
              <Minus className="size-3" />
            </Button>
            <input
              type="range"
              min="10"
              max="24"
              step="1"
              value={design.pagePadding}
              onChange={(e) =>
                setPagePadding(Number.parseInt(e.target.value, 10))
              }
              className="flex-1 accent-slate-900 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() =>
                setPagePadding(Math.min(24, design.pagePadding + 1))
              }
              className="size-6 rounded text-slate-500 hover:text-slate-800"
              title="增大边距"
            >
              <Plus className="size-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* 4. 底部重置操作 */}
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
