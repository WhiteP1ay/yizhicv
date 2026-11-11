"use client";

import { Check, Palette, Plus, RotateCcw, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResumeStore } from "@/store/resume";

export interface ColorPreset {
  name: string;
  value: string;
}

export const DEFAULT_PRESET_COLORS: ColorPreset[] = [
  { name: "曜石黑", value: "#0f172a" },
  { name: "沉稳深灰", value: "#334155" },
  { name: "冷石灰", value: "#64748b" },
  { name: "浅灰 (默认)", value: "#e2e8f0" },
  { name: "商务蓝", value: "#1d4ed8" },
  { name: "深湖青", value: "#0f766e" },
  { name: "森林绿", value: "#15803d" },
  { name: "勃艮第红", value: "#b91c1c" },
  { name: "罗兰紫", value: "#7e22ce" },
  { name: "暖琥珀", value: "#b45309" },
];

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

export interface ColorPickerPaletteProps {
  /** 面板属性标签，例如 "文字颜色" 或 "分割线颜色" */
  label: string;
  /** 当前选中的颜色 (Hex 格式，如 #0f172a，空串表示默认色) */
  value?: string;
  /** 颜色变更回调 (预设选取、自定义槽位选取、拾色器拾色) */
  onChange: (color: string) => void;
  /** 点击「恢复默认」回调（若不传则不显示恢复默认按钮） */
  onReset?: () => void;
  /** 默认色文字提示，如 "默认正文色" 或 "浅灰默认" */
  defaultLabel?: string;
  /** 自定义预设色板，缺省使用精选 10 款常用商务颜色 */
  presets?: ColorPreset[];
  /** 容器额外样式 */
  className?: string;
}

/**
 * 统一的调色板与 5 个自定义颜色槽封装组件
 * 涵盖：常用预设色块、5 个带「+」加号的自定义槽位、弹窗拾色器与本地/工程持久化
 */
export const ColorPickerPalette: React.FC<ColorPickerPaletteProps> = ({
  label,
  value = "",
  onChange,
  onReset,
  defaultLabel = "默认颜色",
  presets = DEFAULT_PRESET_COLORS,
  className = "space-y-2",
}) => {
  const { resume, setCustomColorSlot } = useResumeStore();

  const rawCustomColors = resume.settings.customColors;
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
  const [pickerTempColor, setPickerTempColor] = useState<string>("#1d4ed8");

  // LocalStorage 兜底持久化同步初始化
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const isAllNull = customColors.every((c) => !c);
        if (isAllNull) {
          const cached = localStorage.getItem("yizhicv_custom_colors");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              parsed.slice(0, 5).forEach((color, idx) => {
                if (color && typeof color === "string") {
                  setCustomColorSlot(idx, color);
                }
              });
            }
          }
        }
      } catch {
        // ignore storage access error
      }
    }
  }, [customColors, setCustomColorSlot]);

  // 打开指定槽位的原生拾色器弹窗
  const handleOpenSlotPicker = (index: number) => {
    activeSlotIndexRef.current = index;
    const initialColor = customColors[index] || value || "#1d4ed8";
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

  // 拾色器选色后：实时保存至自定义槽位并触发 onChange 回调
  const handleSlotColorChange = (newColor: string) => {
    setPickerTempColor(newColor);
    const index = activeSlotIndexRef.current;
    setCustomColorSlot(index, newColor);
    onChange(newColor);
  };

  // 清空指定自定义槽位
  const handleClearSlot = (index: number) => {
    setCustomColorSlot(index, null);
  };

  const hasCustomValue = Boolean(value);

  return (
    <div className={className}>
      {/* 1. 顶部标签与恢复默认 */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-600 flex items-center gap-1">
          <Palette className="size-3 text-slate-400" />
          <span>{label}</span>
        </span>
        {onReset && hasCustomValue ? (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onPointerDown={(e) => e.preventDefault()}
            onClick={onReset}
            className="h-5 px-1.5 text-[10px] text-slate-400 hover:text-slate-700 gap-1 rounded cursor-pointer"
            title="恢复默认颜色"
          >
            <RotateCcw className="size-2.5" />
            <span>恢复默认</span>
          </Button>
        ) : (
          <span className="text-[10px] text-slate-400 font-mono uppercase">
            {value || defaultLabel}
          </span>
        )}
      </div>

      {/* 2. 常用预设颜色色板 */}
      <div className="flex items-center gap-1.5 flex-wrap bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs">
        {presets.map((c) => {
          const isSelected =
            Boolean(value) && value.toLowerCase() === c.value.toLowerCase();
          return (
            <button
              key={c.value}
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => onChange(c.value)}
              style={{ backgroundColor: c.value }}
              className={`size-5 rounded-full relative transition-all flex items-center justify-center cursor-pointer shadow-2xs border ${
                isSelected
                  ? "ring-2 ring-blue-500 ring-offset-1 scale-110 border-transparent shadow-xs"
                  : "border-black/10 hover:scale-105"
              }`}
              title={`${c.name} (${c.value})`}
            >
              {isSelected && (
                <Check
                  className={`size-2.5 stroke-[3] ${
                    isBrightColor(c.value) ? "text-slate-900" : "text-white"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. 5 个自定义颜色槽位 (圈里一个加号，点击弹窗拾色器，自动保存) */}
      <Separator className="my-1.5 bg-slate-100" />
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">自定义颜色槽</span>
          <span className="text-[10px] text-slate-400 font-mono">5 个色槽</span>
        </div>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          {SLOT_KEYS.map((slotKey, index) => {
            const slotColor = customColors[index];
            const isSelected =
              Boolean(slotColor) &&
              Boolean(value) &&
              value.toLowerCase() === slotColor?.toLowerCase();

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
                  onClick={() => onChange(slotColor)}
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

      {/* 隐藏的原生拾色器 input */}
      <input
        ref={slotPickerInputRef}
        type="color"
        data-slot-picker="true"
        value={pickerTempColor}
        onChange={(e) => handleSlotColorChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
};
