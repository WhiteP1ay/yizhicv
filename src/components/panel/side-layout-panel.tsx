"use client";

import { Columns2 } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";
import { ConfigCard } from "./config-card";

export const SideLayoutPanel: React.FC = () => {
  const getEffectiveEditor = useActiveEditorStore(
    (state) => state.getEffectiveEditor,
  );

  const handleInsert = () => {
    const current = getEffectiveEditor();
    if (!current) {
      toast.error("未找到可编辑模块，请先在画布中点击选中一个内容模块");
      return;
    }
    current.chain().focus().insertSideLayout().run();
  };

  return (
    <ConfigCard
      id="side-layout"
      data-testid="side-layout-panel"
      title="左右布局"
      icon={<Columns2 className="size-3.5 text-blue-600" />}
      className="space-y-2.5"
    >
      <p className="text-[11px] leading-relaxed text-slate-500">
        一行两格。左右都能写多行文字，或放图片。拖中间的线改左右宽度。鼠标移到这一行，点左侧删除。
      </p>
      <Button
        type="button"
        onPointerDown={(event) => event.preventDefault()}
        onClick={handleInsert}
        className="w-full h-8 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 gap-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
      >
        <Columns2 className="size-3.5" />
        <span>插入左右布局</span>
      </Button>
    </ConfigCard>
  );
};
