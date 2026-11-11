"use client";

import type { Editor } from "@tiptap/react";
import { Heading1, Heading2, Heading3, Type } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface SectionToolbarProps {
  editor: Editor;
}

export const SectionToolbar: React.FC<SectionToolbarProps> = ({ editor }) => {
  // 监听光标移动与文档变更，使标题激活状态毫秒级实时响应
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => {
      setTick((t) => t + 1);
    };

    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);

    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  const isH1 = editor.isActive("heading", { level: 1 });
  const isH2 = editor.isActive("heading", { level: 2 });
  const isH3 = editor.isActive("heading", { level: 3 });
  const isParagraph = editor.isActive("paragraph") || (!isH1 && !isH2 && !isH3);

  return (
    <div
      role="toolbar"
      aria-label="模块标题与段落工具栏"
      className="flex items-center gap-0.5 p-1 bg-slate-900/95 backdrop-blur-md text-white rounded-lg shadow-xl border border-slate-700/60 z-30 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      <span className="text-[11px] font-medium text-slate-400 pl-1.5 pr-1 select-none">
        标题
      </span>

      {/* 一级标题 */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          isH1
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="一级标题 (H1: 主标题 / 姓名)"
      >
        <Heading1 className="size-3.5" />
      </Button>

      {/* 二级标题 */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          isH2
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="二级标题 (H2: 模块大标题)"
      >
        <Heading2 className="size-3.5" />
      </Button>

      {/* 三级标题 */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          isH3
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="三级标题 (H3: 岗位 / 公司 / 项目)"
      >
        <Heading3 className="size-3.5" />
      </Button>

      <span className="w-px h-3.5 bg-slate-700/80 my-auto mx-0.5" />

      {/* 正文 */}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`h-7 w-7 rounded transition-colors ${
          isParagraph
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="正文段落 (恢复普通文本)"
      >
        <Type className="size-3.5" />
      </Button>
    </div>
  );
};
