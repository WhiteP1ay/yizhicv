"use client";

import { Minus, Plus, RotateCcw, Sliders, Type } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useResumeStore } from "@/store/resume";
import { AlignInspector } from "./align-inspector";
import { ConfigCard } from "./config-card";
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
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs text-slate-700 select-none">
      {/* 1. 文本区块 (淡灰底圆角，实时响应光标选区) */}
      <TextInspector />

      <AlignInspector />

      {/* 2. 版面区块 (淡灰底圆角，统一样式规范) */}
      <ConfigCard
        id="layout"
        data-testid="layout-inspector"
        title="版面"
        icon={<Sliders className="size-3.5 text-blue-600" />}
        className="space-y-4"
      >
        {/* 字体族群 */}
        <section className="space-y-2">
          <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5">
            <Type className="size-3 text-slate-400" />
            <span>字体族群</span>
          </div>

          <ToggleGroup
            value={[design.fontFamily]}
            onValueChange={(val) => {
              if (val.length > 0) {
                setFontFamily(val[val.length - 1] as "sans" | "serif" | "mono");
              }
            }}
            className="grid grid-cols-3 gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200 w-full"
          >
            {FONT_OPTIONS.map((f) => (
              <ToggleGroupItem
                key={f.key}
                value={f.key}
                className="h-auto py-1.5 px-2 flex flex-col items-center justify-center rounded-md transition-all data-pressed:bg-white data-pressed:text-slate-900 data-pressed:shadow-xs data-pressed:font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 cursor-pointer"
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
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </section>

        <Separator className="my-2 bg-slate-200/60" />

        {/* 设计排版数值 Token */}
        <section className="space-y-4">
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
              <Slider
                min={9}
                max={13}
                step={0.5}
                value={design.fontSize}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  setFontSize(Number(num.toFixed(1)));
                }}
                className="flex-1"
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
              <Slider
                min={1.0}
                max={2.2}
                step={0.05}
                value={design.lineHeight}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  setLineHeight(Number(num.toFixed(2)));
                }}
                className="flex-1"
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
              <Slider
                min={0}
                max={32}
                step={2}
                value={design.sectionGap}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  setSectionGap(Math.round(num));
                }}
                className="flex-1"
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
              <Slider
                min={0}
                max={24}
                step={1}
                value={design.pagePadding}
                onValueChange={(val) => {
                  const num = Array.isArray(val) ? val[0] : val;
                  setPagePadding(Math.round(num));
                }}
                onPointerDown={() => setIsPaddingHighlight(true)}
                onPointerUp={() => setIsPaddingHighlight(false)}
                className="flex-1"
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
      </ConfigCard>

      {/* 3. 底部重置操作 */}
      <div className="pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={resetDesign}
          className="w-full h-8 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 gap-1.5 rounded-lg border-slate-200 cursor-pointer"
        >
          <RotateCcw className="size-3 text-slate-400" />
          <span>恢复默认样式</span>
        </Button>
      </div>
    </div>
  );
};
