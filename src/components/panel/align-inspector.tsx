"use client";

import type { Editor } from "@tiptap/react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import type { CellVerticalAlign } from "@/components/editor/extensions/cell-vertical-align";
import type { BlockTextAlign } from "@/components/editor/extensions/text-align";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { useActiveEditorStore } from "@/store/active-editor";
import { ConfigCard } from "./config-card";

const ALIGN_OPTIONS: Array<{
  value: BlockTextAlign;
  label: string;
  icon: typeof AlignLeft;
}> = [
  { value: "left", label: "居左", icon: AlignLeft },
  { value: "center", label: "居中", icon: AlignCenter },
  { value: "right", label: "居右", icon: AlignRight },
];

const VERTICAL_OPTIONS: Array<{
  value: CellVerticalAlign;
  label: string;
  icon: typeof AlignVerticalJustifyStart;
}> = [
  { value: "top", label: "上对齐", icon: AlignVerticalJustifyStart },
  { value: "middle", label: "居中", icon: AlignVerticalJustifyCenter },
  { value: "bottom", label: "下对齐", icon: AlignVerticalJustifyEnd },
];

function currentAlign(editor: Editor | null): BlockTextAlign {
  if (!editor) return "left";
  const raw = editor.isActive("heading")
    ? editor.getAttributes("heading").textAlign
    : editor.getAttributes("paragraph").textAlign;
  if (raw === "center" || raw === "right") return raw;
  return "left";
}

function currentVerticalAlign(editor: Editor | null): CellVerticalAlign | null {
  if (!editor?.isActive("tableCell")) return null;
  const raw = editor.getAttributes("tableCell").verticalAlign;
  if (raw === "middle" || raw === "bottom") return raw;
  return "top";
}

export const AlignInspector: React.FC = () => {
  const { editor, selectionTick, getEffectiveEditor } = useActiveEditorStore();
  void selectionTick;
  const align = currentAlign(editor);
  const verticalAlign = currentVerticalAlign(editor);

  const apply = (next: BlockTextAlign) => {
    const current = editor ?? getEffectiveEditor();
    if (!current) {
      toast.error("请先在画布中点击一段文字");
      return;
    }
    current.chain().focus().setTextAlign(next).run();
  };

  const applyVertical = (next: CellVerticalAlign) => {
    const current = editor ?? getEffectiveEditor();
    if (!current) {
      toast.error("请先在画布中点击一段文字");
      return;
    }
    if (!current.isActive("tableCell")) {
      toast.error("请先把光标放进左右布局的格子里");
      return;
    }
    current.chain().focus().setCellVerticalAlign(next).run();
  };

  return (
    <ConfigCard
      id="block-align"
      data-testid="align-inspector"
      title="布局"
      icon={<AlignCenter className="size-3.5 text-blue-600" />}
      className="space-y-2.5"
    >
      <SegmentedControl
        columns={3}
        value={align}
        options={ALIGN_OPTIONS}
        onValueChange={apply}
      />
      <p className="text-[11px] leading-relaxed text-slate-500">
        左右两格高度不一样时，这一格的内容可以贴上边、居中或贴下边。
      </p>
      <SegmentedControl
        columns={3}
        value={verticalAlign}
        options={VERTICAL_OPTIONS}
        onValueChange={applyVertical}
      />
    </ConfigCard>
  );
};
