"use client";

import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  Bold,
  EyeOff,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  Underline,
  Unlink,
} from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";

interface CanvasBubbleMenuProps {
  editor: Editor | null;
}

export const CanvasBubbleMenu: React.FC<CanvasBubbleMenuProps> = ({
  editor,
}) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("输入链接地址 (URL):", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url, target: "_blank" })
      .run();
  };

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 p-1 bg-slate-900/95 backdrop-blur-md text-white rounded-lg shadow-2xl border border-slate-700/60 z-50 animate-in fade-in zoom-in-95 duration-100"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
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

      <span className="w-px h-4 bg-slate-700 my-auto mx-0.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
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

      <span className="w-px h-4 bg-slate-700 my-auto mx-0.5" />

      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={setLink}
        className={`h-7 w-7 rounded transition-colors ${
          editor.isActive("link")
            ? "bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
            : "text-slate-300 hover:bg-slate-700/80 hover:text-white"
        }`}
        title="插入超链接"
      >
        <LinkIcon className="w-3.5 h-3.5" />
      </Button>

      {editor.isActive("link") && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className="h-7 w-7 rounded hover:bg-slate-700/80 text-rose-400 hover:text-rose-300 transition-colors"
          title="移除链接"
        >
          <Unlink className="w-3.5 h-3.5" />
        </Button>
      )}

      {/* 王牌特色：脱敏 */}
      <Button
        type="button"
        variant="ghost"
        size="xs"
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
