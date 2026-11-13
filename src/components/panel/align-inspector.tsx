"use client";

import type { Editor } from "@tiptap/react";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import type { BlockTextAlign } from "@/components/editor/extensions/text-align";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

function currentAlign(editor: Editor | null): BlockTextAlign {
  if (!editor) return "left";
  const raw = editor.isActive("heading")
    ? editor.getAttributes("heading").textAlign
    : editor.getAttributes("paragraph").textAlign;
  if (raw === "center" || raw === "right") return raw;
  return "left";
}

export const AlignInspector: React.FC = () => {
  const { editor, selectionTick, getEffectiveEditor } = useActiveEditorStore();
  void selectionTick;
  const align = currentAlign(editor);

  const apply = (next: BlockTextAlign) => {
    const current = editor ?? getEffectiveEditor();
    if (!current) {
      toast.error("请先在画布中点击一段文字");
      return;
    }
    current.chain().focus().setTextAlign(next).run();
  };

  return (
    <ConfigCard
      id="block-align"
      data-testid="align-inspector"
      title="布局"
      icon={<AlignCenter className="size-3.5 text-blue-600" />}
      className="space-y-2.5"
    >
      <ToggleGroup
        value={[align]}
        onValueChange={(val) => {
          const next = val[val.length - 1];
          if (next === "left" || next === "center" || next === "right") {
            apply(next);
          }
        }}
        className="grid grid-cols-3 gap-1 p-1 bg-white rounded-lg border border-slate-200 shadow-2xs w-full"
      >
        {ALIGN_OPTIONS.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            onPointerDown={(event) => event.preventDefault()}
            className="h-8 gap-1 rounded text-xs font-medium text-slate-600 transition-all cursor-pointer hover:bg-slate-100 hover:text-slate-900 data-pressed:bg-slate-900 data-pressed:text-white data-pressed:shadow-2xs"
            title={option.label}
          >
            <option.icon className="size-3.5" />
            <span>{option.label}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ConfigCard>
  );
};
