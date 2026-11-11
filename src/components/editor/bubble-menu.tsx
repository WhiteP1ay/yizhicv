"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Underline,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CanvasBubbleMenuProps {
  editor: Editor | null;
}

/**
 * 严格控制气泡菜单显示时机（顶层静态函数，保持引用恒定，防止 Tiptap BubbleMenu 内部 useEffect 循环触发）
 * 1. 选中分割线 (horizontalRule) 或节点选区时坚决不弹出
 * 2. 选区必须是非空文本选区
 */
const shouldShowBubbleMenu = ({
  editor: currentEditor,
  state,
  from,
  to,
}: {
  editor: Editor;
  state: Editor["state"];
  from: number;
  to: number;
}): boolean => {
  // 1. 若当前处于非可编辑状态，不展示
  if (!currentEditor.isEditable) {
    return false;
  }

  // 2. 若当前选中或落在分割线上，坚决不弹出气泡菜单
  if (currentEditor.isActive("horizontalRule")) {
    return false;
  }

  // 3. 选区必须是非空选区 (未选中文本时不弹出)
  const { selection } = state;
  if (selection.empty) {
    return false;
  }

  // 4. 若为节点选区（例如 atom 节点分割线），不弹出文本格式化气泡
  const sel = selection as { node?: { type: { name: string } } };
  if (sel.node) {
    return false;
  }

  // 5. 必须有实际的选中文本内容（去除空白后大于 0）
  const text = state.doc.textBetween(from, to);
  if (!text || text.trim().length === 0) {
    return false;
  }

  return true;
};

export const CanvasBubbleMenu: React.FC<CanvasBubbleMenuProps> = ({
  editor,
}) => {
  if (!editor) return null;

  return (
    <TiptapBubbleMenu
      editor={editor}
      shouldShow={shouldShowBubbleMenu}
      className="flex items-center gap-0.5 p-1 bg-slate-900/95 backdrop-blur-md text-white rounded-lg shadow-2xl border border-slate-700/60 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("bold")
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="加粗"
      >
        <Bold className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("italic")
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="斜体"
      >
        <Italic className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("underline")
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="下划线"
      >
        <Underline className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("highlight")
            ? "bg-yellow-500/80 text-white hover:bg-yellow-500/80 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="高亮"
      >
        <Highlighter className="w-3.5 h-3.5" />
      </Button>

      <Separator
        orientation="vertical"
        className="h-4 bg-slate-700 my-auto mx-0.5"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("heading", { level: 1 })
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="一级标题 (主标题 / 姓名)"
      >
        <Heading1 className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("heading", { level: 2 })
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="二级标题 (模块大标题)"
      >
        <Heading2 className="w-3.5 h-3.5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("heading", { level: 3 })
            ? "bg-slate-700 text-white hover:bg-slate-700 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="三级标题"
      >
        <Heading3 className="w-3.5 h-3.5" />
      </Button>

      <Separator
        orientation="vertical"
        className="h-4 bg-slate-700 my-auto mx-0.5"
      />

      {/* 王牌特色：脱敏 */}
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleMark("blur").run()}
        className={`h-7 px-2 rounded flex items-center gap-1 text-xs font-medium transition-colors ${
          editor.isActive("blur")
            ? "bg-purple-600 text-white ring-1 ring-purple-400 hover:bg-purple-600 hover:text-white"
            : "text-purple-300 hover:bg-purple-950/80 hover:text-purple-200"
        }`}
        title="将选中文本标记为脱敏信息（预览/公开时高斯模糊遮盖）"
      >
        <EyeOff className="w-3.5 h-3.5" />
        <span>脱敏</span>
      </Button>
    </TiptapBubbleMenu>
  );
};
