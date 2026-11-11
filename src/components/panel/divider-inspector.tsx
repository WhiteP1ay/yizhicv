"use client";

import { Check, Minus, Pipette, Plus, RotateCcw } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";

const DIVIDER_COLOR_SWATCHES = [
  { name: "浅灰 (默认)", value: "#e2e8f0" },
  { name: "银灰", value: "#cbd5e1" },
  { name: "冷石灰", value: "#94a3b8" },
  { name: "曜石黑", value: "#0f172a" },
  { name: "商务蓝", value: "#1d4ed8" },
  { name: "深湖青", value: "#0f766e" },
  { name: "森林绿", value: "#15803d" },
  { name: "勃艮第红", value: "#b91c1c" },
  { name: "罗兰紫", value: "#7e22ce" },
  { name: "暖琥珀", value: "#b45309" },
];

const HEIGHT_PRESETS = [1, 2, 3, 4];

export const DividerInspector: React.FC = () => {
  const { getEffectiveEditor, selectionTick } = useActiveEditorStore();
  const [height, setHeight] = useState<number>(1);
  const [color, setColor] = useState<string>("#e2e8f0");
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 监听编辑器选区：若当前选区正好落在分割线上，自动回填其高度与颜色
  useEffect(() => {
    void selectionTick;
    const editor = getEffectiveEditor();
    if (!editor) return;

    if (editor.isActive("horizontalRule")) {
      const attrs = editor.getAttributes("horizontalRule");
      if (attrs.height) {
        setHeight(Number(attrs.height) || 1);
      }
      if (attrs.color) {
        setColor(attrs.color);
      }
    }
  }, [selectionTick, getEffectiveEditor]);

  // 修改高度：若当前正选中分割线，实时联动更新已有分割线
  const handleHeightChange = (newHeight: number) => {
    const clamped = Math.max(1, Math.min(8, newHeight));
    setHeight(clamped);

    const editor = getEffectiveEditor();
    if (editor?.isActive("horizontalRule")) {
      editor.commands.updateAttributes("horizontalRule", {
        height: clamped,
        color,
      });
    }
  };

  // 修改颜色：若当前正选中分割线，实时联动更新已有分割线
  const handleColorChange = (newColor: string) => {
    setColor(newColor);

    const editor = getEffectiveEditor();
    if (editor?.isActive("horizontalRule")) {
      editor.commands.updateAttributes("horizontalRule", {
        height,
        color: newColor,
      });
    }
  };

  // 重置回默认浅灰 1px
  const handleReset = () => {
    handleHeightChange(1);
    handleColorChange("#e2e8f0");
  };

  // 点击插入分割线
  const handleInsert = () => {
    const editor = getEffectiveEditor();
    if (!editor) return;

    editor
      .chain()
      .focus()
      .insertContent({
        type: "horizontalRule",
        attrs: {
          height,
          color,
        },
      })
      .run();
  };

  return (
    <div className="space-y-3.5 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl select-none">
      {/* 头部标题与当前参数展示 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Minus className="size-3.5 text-blue-600 stroke-[2.5]" />
          <span>插入分割线</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-mono">
            {height}px · {color.toUpperCase()}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={handleReset}
            className="size-5 rounded text-slate-400 hover:text-slate-700"
            title="重置为默认浅灰 1px"
          >
            <RotateCcw className="size-2.5" />
          </Button>
        </div>
      </div>

      {/* 实时视觉预览窗 */}
      <div className="px-3 py-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-center">
        <div className="text-[10px] text-slate-400 mb-1.5 font-medium">
          实时效果预览
        </div>
        <div className="w-full py-1">
          <div
            style={{
              borderTop: `${height}px solid ${color}`,
            }}
            className="w-full transition-all duration-150"
          />
        </div>
      </div>

      {/* 1. 分割线高度（粗细） */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">分割线高度</span>
          <span className="font-mono text-slate-400 text-[10px]">
            {height} px
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* 预设高度 */}
          {HEIGHT_PRESETS.map((h) => {
            const isSelected = height === h;
            return (
              <Button
                key={h}
                type="button"
                variant="outline"
                size="xs"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleHeightChange(h)}
                className={`h-6 flex-1 text-[11px] font-mono rounded-md transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-900 hover:text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200"
                }`}
              >
                {h}px
              </Button>
            );
          })}

          {/* 步进器 */}
          <div className="flex items-center gap-0.5 ml-1">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={height <= 1}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleHeightChange(height - 1)}
              className="size-6 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
              title="高度 -1px"
            >
              <Minus className="size-2.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              disabled={height >= 8}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleHeightChange(height + 1)}
              className="size-6 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30"
              title="高度 +1px"
            >
              <Plus className="size-2.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 分割线颜色 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">分割线颜色</span>
          <span className="font-mono text-slate-400 text-[10px] uppercase">
            {color}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {DIVIDER_COLOR_SWATCHES.map((swatch) => {
            const isSelected =
              color.toLowerCase() === swatch.value.toLowerCase();
            return (
              <button
                key={swatch.value}
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => handleColorChange(swatch.value)}
                className={`size-5 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
                  isSelected
                    ? "scale-110 ring-2 ring-blue-500 ring-offset-1 border-transparent shadow-xs"
                    : "border-black/10 hover:scale-105"
                }`}
                style={{ backgroundColor: swatch.value }}
                title={swatch.name}
              >
                {isSelected && (
                  <Check
                    className={`size-2.5 stroke-[3] ${
                      swatch.value === "#e2e8f0" || swatch.value === "#cbd5e1"
                        ? "text-slate-800"
                        : "text-white"
                    }`}
                  />
                )}
              </button>
            );
          })}

          {/* 自定义拾色器 */}
          <div className="relative flex items-center">
            <input
              ref={colorInputRef}
              type="color"
              value={color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="sr-only"
            />
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => colorInputRef.current?.click()}
              className="size-5 rounded-full border-dashed border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400 transition-colors"
              title="自定义拾色器"
            >
              <Pipette className="size-2.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 3. 插入分割线主动作按钮 */}
      <div className="pt-1">
        <Button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleInsert}
          className="w-full h-8 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 gap-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Minus className="size-3.5 stroke-[2.5]" />
          <span>插入分割线</span>
        </Button>
      </div>
    </div>
  );
};
