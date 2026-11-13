"use client";

import { Columns2, Trash2 } from "lucide-react";
import type React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";
import { ConfigCard } from "./config-card";

export const SideLayoutPanel: React.FC = () => {
  const { getEffectiveEditor, selectionTick } = useActiveEditorStore();
  void selectionTick;
  const editor = getEffectiveEditor();
  const insideSideLayout = Boolean(
    editor?.isActive("table") &&
      editor.getAttributes("table").layout === "side",
  );

  const handleInsert = () => {
    const current = getEffectiveEditor();
    if (!current) {
      toast.error("未找到可编辑模块，请先在画布中点击选中一个内容模块");
      return;
    }
    current.chain().focus().insertSideLayout().run();
  };

  const handleDelete = () => {
    const current = getEffectiveEditor();
    if (!current?.isActive("table")) return;
    if (window.confirm("确定删除这个左右布局吗？两边的内容会一起删掉。")) {
      current.chain().focus().deleteTable().run();
    }
  };

  return (
    <ConfigCard
      id="side-layout"
      data-testid="side-layout-panel"
      title="左右布局"
      icon={<Columns2 className="size-3.5 text-blue-600" />}
      badge={
        insideSideLayout ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
            <span className="size-1.5 rounded-full bg-blue-600" />
            <span>光标在布局里</span>
          </span>
        ) : null
      }
      className="space-y-2.5"
    >
      <p className="text-[11px] leading-relaxed text-slate-500">
        一行两格。左右都能写多行文字，或放图片。拖两格之间的线改左右宽度，线只在编辑时出现。
      </p>
      {insideSideLayout ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={handleInsert}
            variant="outline"
            className="flex-1 h-8 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 gap-1 rounded-lg border-slate-200 cursor-pointer"
          >
            <Columns2 className="size-3.5" />
            <span>再插入一组</span>
          </Button>
          <Button
            type="button"
            onPointerDown={(event) => event.preventDefault()}
            onClick={handleDelete}
            variant="outline"
            className="h-8 px-2.5 text-xs font-medium text-red-600 bg-red-50/50 hover:bg-red-100 border-red-200 rounded-lg cursor-pointer"
          >
            <Trash2 className="size-3 text-red-600" />
            <span>删除</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={handleInsert}
          className="w-full h-8 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 gap-1.5 rounded-lg shadow-2xs transition-all cursor-pointer"
        >
          <Columns2 className="size-3.5" />
          <span>插入左右布局</span>
        </Button>
      )}
    </ConfigCard>
  );
};
