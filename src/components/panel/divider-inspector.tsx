"use client";

import { Check, Info, Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";
import { ColorPickerPalette } from "./color-picker-palette";

const HEIGHT_PRESETS = [1, 2, 3, 4];

export const DividerInspector: React.FC = () => {
  const { getEffectiveEditor, selectionTick } = useActiveEditorStore();
  const [height, setHeight] = useState<number>(1);
  const [color, setColor] = useState<string>("#e2e8f0");

  const editor = getEffectiveEditor();
  // 依赖 selectionTick 触发重算选区状态
  void selectionTick;
  const isDividerSelected = Boolean(editor?.isActive("horizontalRule"));

  // 监听选区变化：若当前光标/NodeSelection 落在已有分割线上，回填其属性
  useEffect(() => {
    void selectionTick;
    const currentEditor = getEffectiveEditor();
    if (!currentEditor) return;

    if (currentEditor.isActive("horizontalRule")) {
      const attrs = currentEditor.getAttributes("horizontalRule");
      if (attrs.height) {
        setHeight(Number(attrs.height) || 1);
      }
      if (attrs.color) {
        setColor(attrs.color);
      }
    }
  }, [selectionTick, getEffectiveEditor]);

  // 修改高度：若当前处于二次编辑选中态，实时联动更新已有分割线
  const handleHeightChange = (newHeight: number) => {
    const clamped = Math.max(1, Math.min(8, newHeight));
    setHeight(clamped);

    const currentEditor = getEffectiveEditor();
    if (currentEditor?.isActive("horizontalRule")) {
      currentEditor.commands.updateAttributes("horizontalRule", {
        height: clamped,
        color,
      });
    }
  };

  // 修改颜色：若当前处于二次编辑选中态，实时联动更新已有分割线
  const handleColorChange = (newColor: string) => {
    setColor(newColor);

    const currentEditor = getEffectiveEditor();
    if (currentEditor?.isActive("horizontalRule")) {
      currentEditor.commands.updateAttributes("horizontalRule", {
        height,
        color: newColor,
      });
    }
  };

  // 重置为默认浅灰 1px (若正选中分割线，同步重置其样式)
  const handleReset = () => {
    handleHeightChange(1);
    handleColorChange("#e2e8f0");
  };

  // 删除当前选中的分割线
  const handleDeleteSelected = () => {
    const currentEditor = getEffectiveEditor();
    if (currentEditor?.isActive("horizontalRule")) {
      currentEditor.chain().focus().deleteSelection().run();
    }
  };

  // 点击插入新分割线
  const handleInsert = () => {
    const currentEditor = getEffectiveEditor();
    if (!currentEditor) return;

    // 若当前恰好正选中某条已有分割线，将光标平移至其后方再插入，避免意外覆盖
    if (currentEditor.isActive("horizontalRule")) {
      const { to } = currentEditor.state.selection;
      currentEditor
        .chain()
        .setTextSelection(to)
        .insertContent({
          type: "horizontalRule",
          attrs: { height, color },
        })
        .run();
      return;
    }

    currentEditor
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
    <div
      data-testid="divider-inspector"
      className={`space-y-3.5 p-3 rounded-xl select-none transition-all duration-200 ${
        isDividerSelected
          ? "bg-blue-50/40 border border-blue-200/80 shadow-xs ring-1 ring-blue-500/20"
          : "bg-slate-50/70 border border-slate-200/80"
      }`}
    >
      {/* 头部标题与二次编辑状态指示 */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
          <Minus className="size-3.5 text-blue-600 stroke-[2.5]" />
          <span>分割线</span>
          {isDividerSelected && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 animate-in fade-in">
              <span className="size-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>已选中</span>
            </span>
          )}
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
            className="size-5 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
            title="重置为默认浅灰 1px"
          >
            <RotateCcw className="size-2.5" />
          </Button>
        </div>
      </div>

      {/* 实时视觉预览窗 */}
      <div className="px-3 py-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex flex-col justify-center">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
          <span>{isDividerSelected ? "当前选中效果" : "效果预览"}</span>
          {isDividerSelected && (
            <span className="text-blue-600 font-normal flex items-center gap-0.5">
              <Check className="size-2.5" />
              <span>实时联动中</span>
            </span>
          )}
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
                className={`h-6 flex-1 text-[11px] font-mono rounded-md transition-all cursor-pointer ${
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
              className="size-6 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
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
              className="size-6 rounded text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer"
              title="高度 +1px"
            >
              <Plus className="size-2.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 分割线颜色 (统一封装组件：预设色板 + 5 个自定义槽位 + 弹窗拾色器) */}
      <ColorPickerPalette
        label="分割线颜色"
        value={color}
        onChange={handleColorChange}
        onReset={
          color.toLowerCase() !== "#e2e8f0"
            ? () => handleColorChange("#e2e8f0")
            : undefined
        }
        defaultLabel="浅灰 (默认)"
      />

      {/* 3. 动作区：区分常规插入态 vs 二次编辑态 */}
      <div className="pt-1 space-y-2">
        {isDividerSelected ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleInsert}
                variant="outline"
                className="flex-1 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 gap-1 rounded-lg border-slate-200 cursor-pointer"
                title="在选中分割线下方插入一条新的分割线"
              >
                <Plus className="size-3" />
                <span>插入新线</span>
              </Button>

              <Button
                type="button"
                onPointerDown={(e) => e.preventDefault()}
                onClick={handleDeleteSelected}
                variant="outline"
                className="h-8 px-2.5 text-xs font-medium text-red-600 bg-red-50/50 hover:bg-red-100 border-red-200 rounded-lg cursor-pointer transition-colors"
                title="删除当前选中的分割线 (或按 Delete / Backspace 键)"
              >
                <Trash2 className="size-3 text-red-600" />
                <span>删除此线</span>
              </Button>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-100/60 px-2 py-1 rounded-md">
              <Info className="size-3 flex-shrink-0" />
              <span>调节上方参数将即时生效，也可按 Backspace 删除</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <Button
              type="button"
              onPointerDown={(e) => e.preventDefault()}
              onClick={handleInsert}
              className="w-full h-8 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 gap-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
            >
              <Minus className="size-3.5 stroke-[2.5]" />
              <span>插入分割线</span>
            </Button>
            <p className="text-[10px] text-slate-400 text-center">
              在画布中单击已有分割线，即可直接在此二次编辑
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
