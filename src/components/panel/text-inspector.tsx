"use client";

import {
  Check,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Palette,
  Plus,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";
import { useResumeStore } from "@/store/resume";

const SLOT_KEYS = [
  "custom_slot_0",
  "custom_slot_1",
  "custom_slot_2",
  "custom_slot_3",
  "custom_slot_4",
] as const;

function isBrightColor(hex: string): boolean {
  if (!hex || !hex.startsWith("#")) return false;
  const raw = hex.slice(1);
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const num = Number.parseInt(full, 16);
  if (Number.isNaN(num)) return false;
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return 0.299 * r + 0.587 * g + 0.114 * b > 180;
}

const TEXT_COLOR_SWATCHES = [
  { name: "曜石黑", value: "#0f172a" },
  { name: "沉稳深灰", value: "#334155" },
  { name: "次要灰", value: "#64748b" },
  { name: "商务蓝", value: "#1d4ed8" },
  { name: "深湖青", value: "#0f766e" },
  { name: "森林绿", value: "#15803d" },
  { name: "勃艮第红", value: "#b91c1c" },
  { name: "罗兰紫", value: "#7e22ce" },
  { name: "暖琥珀", value: "#b45309" },
];

const FONT_SIZE_PRESETS = [
  { label: "统一默认", value: "" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "22px", value: "22px" },
];

export const TextInspector: React.FC = () => {
  const { editor, selectionTick } = useActiveEditorStore();
  const { resume, setCustomTextColorSlot } = useResumeStore();

  const rawCustomColors = resume.settings.customTextColors;
  const customColors = useMemo(
    () => [
      rawCustomColors?.[0] ?? null,
      rawCustomColors?.[1] ?? null,
      rawCustomColors?.[2] ?? null,
      rawCustomColors?.[3] ?? null,
      rawCustomColors?.[4] ?? null,
    ],
    [rawCustomColors],
  );

  const activeSlotIndexRef = useRef<number>(0);
  const slotPickerInputRef = useRef<HTMLInputElement>(null);
  const [pickerTempColor, setPickerTempColor] = useState<string>("#2563eb");

  // LocalStorage 缓存同步初始化
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const isAllNull = customColors.every((c) => !c);
        if (isAllNull) {
          const cached = localStorage.getItem("yizhicv_custom_text_colors");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              parsed.slice(0, 5).forEach((color, idx) => {
                if (color && typeof color === "string") {
                  setCustomTextColorSlot(idx, color);
                }
              });
            }
          }
        }
      } catch {
        // ignore storage error
      }
    }
  }, [customColors, setCustomTextColorSlot]);

  if (!editor) {
    return (
      <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500 space-y-1">
        <div className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
          <Type className="size-3.5 text-slate-400" />
          <span>选中文本与排版控制</span>
        </div>
        <p className="text-[11px] text-slate-400">
          在左侧画布点击或选中任意文字，即可在此调整颜色、层级与字号
        </p>
      </div>
    );
  }

  // 依赖 selectionTick 触发重算
  void selectionTick;

  const isH1 = editor.isActive("heading", { level: 1 });
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });
  const isParagraph = editor.isActive("paragraph") || (!isH1 && !isH2 && !isH3);

  const textStyleAttrs = editor.getAttributes("textStyle") || {};
  const currentColor = (textStyleAttrs.color as string) || "";
  const currentFontSize = (textStyleAttrs.fontSize as string) || "";

  // 智能着色：有选区则对选区着色，无选区（光标停留）则对当前整行/块着色
  const applyColor = (color: string) => {
    const { empty, $from } = editor.state.selection;
    if (empty && $from.parent.isTextblock) {
      const from = $from.start();
      const to = $from.end();
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .setColor(color)
        .run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
  };

  // 恢复默认颜色
  const removeColor = () => {
    const { empty, $from } = editor.state.selection;
    if (empty && $from.parent.isTextblock) {
      const from = $from.start();
      const to = $from.end();
      editor.chain().focus().setTextSelection({ from, to }).unsetColor().run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
  };

  // 打开指定槽位的拾色器弹窗
  const handleOpenSlotPicker = (index: number) => {
    activeSlotIndexRef.current = index;
    const initialColor = customColors[index] || currentColor || "#2563eb";
    setPickerTempColor(initialColor);

    setTimeout(() => {
      const input = slotPickerInputRef.current;
      if (input) {
        if (typeof input.showPicker === "function") {
          try {
            input.showPicker();
            return;
          } catch {
            // fallback to click
          }
        }
        input.click();
      }
    }, 10);
  };

  // 拾色器选色后：保存至自定义槽位并即时作用到文字
  const handleSlotColorChange = (newColor: string) => {
    setPickerTempColor(newColor);
    const index = activeSlotIndexRef.current;
    setCustomTextColorSlot(index, newColor);
    applyColor(newColor);
  };

  // 清空指定槽位
  const handleClearSlot = (index: number) => {
    setCustomTextColorSlot(index, null);
  };

  // 智能设置字号：有选区作用于选区，光标停留则作用于当前行/块
  const applyFontSize = (fontSize: string) => {
    const { empty, $from } = editor.state.selection;
    if (empty && $from.parent.isTextblock) {
      const from = $from.start();
      const to = $from.end();
      if (!fontSize) {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .unsetFontSize()
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setTextSelection({ from, to })
          .setFontSize(fontSize)
          .run();
      }
    } else {
      if (!fontSize) {
        editor.chain().focus().unsetFontSize().run();
      } else {
        editor.chain().focus().setFontSize(fontSize).run();
      }
    }
  };

  // 步进字体大小
  const handleStepFontSize = (delta: number) => {
    let sizeNum = 14;
    if (currentFontSize) {
      const parsed = Number.parseInt(currentFontSize, 10);
      if (!Number.isNaN(parsed)) sizeNum = parsed;
    }
    const newSize = Math.max(10, Math.min(36, sizeNum + delta));
    applyFontSize(`${newSize}px`);
  };

  return (
    <div className="space-y-4 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Type className="size-3.5 text-blue-600" />
          <span>选中文本排版</span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {isH1
            ? "一级标题 (H1)"
            : isH2
              ? "二级标题 (H2)"
              : isH3
                ? "三级标题 (H3)"
                : "正文段落 (P)"}
        </span>
      </div>

      {/* 1. 段落 ｜ 标题选择 (Segmented Group) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-slate-600">文本层级</div>
        <div className="grid grid-cols-4 gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={`h-7 px-1 text-xs font-medium rounded transition-all ${
              isParagraph
                ? "bg-slate-900 text-white shadow-2xs hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="恢复普通正文段落"
          >
            正文
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`h-7 px-1 text-xs font-medium rounded transition-all gap-1 ${
              isH1
                ? "bg-slate-900 text-white shadow-2xs hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="设为一级标题 (候选人姓名 / 主标题)"
          >
            <Heading1 className="size-3" />
            <span>H1</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`h-7 px-1 text-xs font-medium rounded transition-all gap-1 ${
              isH2
                ? "bg-slate-900 text-white shadow-2xs hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="设为二级标题 (经历大模块标题)"
          >
            <Heading2 className="size-3" />
            <span>H2</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`h-7 px-1 text-xs font-medium rounded transition-all gap-1 ${
              isH3
                ? "bg-slate-900 text-white shadow-2xs hover:bg-slate-900 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
            title="设为三级标题 (职位 / 项目 / 学校)"
          >
            <Heading3 className="size-3" />
            <span>H3</span>
          </Button>
        </div>
      </div>

      {/* 2. 文字色彩 (自由着色) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600 flex items-center gap-1">
            <Palette className="size-3 text-slate-400" />
            <span>文字颜色</span>
          </span>
          {currentColor ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onPointerDown={(e) => e.preventDefault()}
              onClick={removeColor}
              className="h-5 px-1.5 text-[10px] text-slate-400 hover:text-slate-700 gap-1 rounded"
              title="清除自定义颜色，恢复默认"
            >
              <RotateCcw className="size-2.5" />
              <span>恢复默认</span>
            </Button>
          ) : (
            <span className="text-[10px] text-slate-400">默认正文色</span>
          )}
        </div>

        {/* 预设常用色 */}
        <div className="flex items-center gap-1.5 flex-wrap bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
          {TEXT_COLOR_SWATCHES.map((c) => {
            const isSelected =
              currentColor.toLowerCase() === c.value.toLowerCase();
            return (
              <Button
                key={c.value}
                type="button"
                variant="ghost"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => applyColor(c.value)}
                style={{ backgroundColor: c.value }}
                className={`size-5 rounded-full p-0 relative transition-transform hover:scale-110 shadow-2xs border ${
                  isSelected
                    ? "ring-2 ring-blue-500 ring-offset-1 scale-105"
                    : "border-black/10"
                }`}
                title={`${c.name} (${c.value})`}
              >
                {isSelected && (
                  <Check className="size-2.5 text-white stroke-[2.5]" />
                )}
              </Button>
            );
          })}
        </div>

        {/* 5 个自定义颜色槽位 (圈里一个加号，点击弹窗拾色器并自动持久化) */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-slate-600">自定义颜色槽</span>
            <span className="text-[10px] text-slate-400 font-mono">
              5 个色槽
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
            {SLOT_KEYS.map((slotKey, index) => {
              const slotColor = customColors[index];
              const isSelected =
                Boolean(slotColor) &&
                currentColor.toLowerCase() === slotColor?.toLowerCase();

              if (!slotColor) {
                return (
                  <button
                    key={slotKey}
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => handleOpenSlotPicker(index)}
                    className="size-6 rounded-full border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs group"
                    title={`自定义颜色槽 ${index + 1}：点击打开拾色器`}
                  >
                    <Plus className="size-3 stroke-[2.5] transition-transform group-hover:scale-110" />
                  </button>
                );
              }

              return (
                <div key={slotKey} className="relative group/slot">
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => applyColor(slotColor)}
                    onDoubleClick={() => handleOpenSlotPicker(index)}
                    style={{ backgroundColor: slotColor }}
                    className={`size-6 rounded-full border transition-transform flex items-center justify-center cursor-pointer shadow-2xs ${
                      isSelected
                        ? "ring-2 ring-blue-500 ring-offset-1 scale-105 border-transparent"
                        : "border-black/15 hover:scale-105"
                    }`}
                    title={`自定义槽位 ${index + 1}：${slotColor} (单击应用 / 双击重选)`}
                  >
                    {isSelected && (
                      <Check
                        className={`size-2.5 stroke-[3] ${
                          isBrightColor(slotColor)
                            ? "text-slate-900"
                            : "text-white"
                        }`}
                      />
                    )}
                  </button>

                  {/* 悬停微型清除按钮 */}
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlot(index);
                    }}
                    className="absolute -top-1 -right-1 size-3.5 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity shadow-xs cursor-pointer z-10"
                    title="清空此颜色槽"
                  >
                    <X className="size-2 stroke-[3]" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 隐藏的专用 Slot 拾色器 input */}
        <input
          ref={slotPickerInputRef}
          type="color"
          data-slot-picker="true"
          value={pickerTempColor}
          onChange={(e) => handleSlotColorChange(e.target.value)}
          className="sr-only"
        />
      </div>

      {/* 3. 字体大小 (默认统一，可自定义) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">字号大小</span>
          <span className="font-mono text-slate-400 text-[10px]">
            {currentFontSize || "统一默认"}
          </span>
        </div>

        {/* 预设字号胶囊 */}
        <div className="flex items-center gap-1 flex-wrap">
          {FONT_SIZE_PRESETS.map((preset) => {
            const isSelected =
              (!preset.value && !currentFontSize) ||
              preset.value === currentFontSize;
            return (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="xs"
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => applyFontSize(preset.value)}
                className={`h-6 px-2 text-[11px] rounded-md transition-all ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 hover:bg-slate-900 hover:text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200"
                }`}
              >
                {preset.label}
              </Button>
            );
          })}

          {/* 步进器 */}
          <div className="flex items-center gap-0.5 ml-auto">
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleStepFontSize(-1)}
              className="size-6 rounded text-slate-500 hover:text-slate-900"
              title="字号 -1px"
            >
              <Minus className="size-2.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => handleStepFontSize(1)}
              className="size-6 rounded text-slate-500 hover:text-slate-900"
              title="字号 +1px"
            >
              <Plus className="size-2.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
