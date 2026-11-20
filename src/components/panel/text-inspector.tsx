"use client";

import { Heading1, Heading2, Heading3, Minus, Plus, Type } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useActiveEditorStore } from "@/store/active-editor";
import { ColorPickerPalette } from "./color-picker-palette";
import { ConfigCard } from "./config-card";

const FONT_SIZE_PRESETS = [
  { label: "默认", value: "default" },
  { label: "12px", value: "12px" },
  { label: "14px", value: "14px" },
  { label: "16px", value: "16px" },
  { label: "18px", value: "18px" },
  { label: "22px", value: "22px" },
];

const HEADING_OPTIONS = [
  { value: "p", label: "正文", title: "恢复普通正文段落" },
  {
    value: "h1",
    label: "H1",
    icon: Heading1,
    title: "设为一级标题 (候选人姓名 / 主标题)",
  },
  {
    value: "h2",
    label: "H2",
    icon: Heading2,
    title: "设为二级标题 (经历大模块标题)",
  },
  {
    value: "h3",
    label: "H3",
    icon: Heading3,
    title: "设为三级标题 (职位 / 项目 / 学校)",
  },
];

export const TextInspector: React.FC = () => {
  const { editor, selectionTick } = useActiveEditorStore();

  if (!editor) {
    return (
      <ConfigCard
        id="text"
        dashed
        title="文本"
        icon={<Type className="size-3.5 text-blue-600" />}
        className="space-y-1"
      >
        <p className="text-[11px] text-slate-400">
          在画布中点击或选中任意文字，即可在此调整层级、色彩与字号
        </p>
      </ConfigCard>
    );
  }

  // 依赖 selectionTick 触发重算
  void selectionTick;

  const isH1 = editor.isActive("heading", { level: 1 });
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });

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
    <ConfigCard
      id="text"
      data-testid="text-inspector"
      title="文本"
      icon={<Type className="size-3.5 text-blue-600" />}
      extra={
        <span className="text-[10px] text-slate-400 font-mono">
          {isH1 ? "H1" : isH2 ? "H2" : isH3 ? "H3" : "正文"}
        </span>
      }
      className="space-y-4"
    >
      {/* 1. 段落 ｜ 标题选择 (Segmented Group) */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-slate-600">文本层级</div>
        <SegmentedControl
          columns={4}
          size="sm"
          value={isH1 ? "h1" : isH2 ? "h2" : isH3 ? "h3" : "p"}
          options={[...HEADING_OPTIONS]}
          onValueChange={(next) => {
            if (next === "p") editor.chain().focus().setParagraph().run();
            else if (next === "h1")
              editor.chain().focus().toggleHeading({ level: 1 }).run();
            else if (next === "h2")
              editor.chain().focus().toggleHeading({ level: 2 }).run();
            else editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
        />
      </div>

      {/* 2. 文字色彩 (统一组件：预设色板 + 5 个自定义槽位 + 弹窗拾色器) */}
      <ColorPickerPalette
        label="文字颜色"
        value={currentColor}
        onChange={applyColor}
        onReset={currentColor ? removeColor : undefined}
        defaultLabel="默认正文色"
      />

      {/* 3. 字体大小 (默认统一，可自定义) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-600">字号大小</span>
          <span className="font-mono text-slate-400 text-[10px]">
            {currentFontSize || "默认"}
          </span>
        </div>

        {/* 预设字号胶囊 */}
        <div className="flex items-center gap-1">
          <SegmentedControl
            size="xs"
            className="min-w-0 flex-1"
            value={
              FONT_SIZE_PRESETS.some(
                (preset) => preset.value === currentFontSize,
              )
                ? currentFontSize
                : currentFontSize
                  ? null
                  : "default"
            }
            options={FONT_SIZE_PRESETS}
            onValueChange={(next) =>
              applyFontSize(next === "default" ? "" : next)
            }
          />

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
    </ConfigCard>
  );
};
