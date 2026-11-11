"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Redo2,
  Underline,
  Undo2,
  Unlink,
} from "lucide-react";
import type React from "react";

interface EditorToolbarProps {
  editor: Editor | null;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("请输入链接地址 (URL):", previousUrl);

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

  const toggleBlur = () => {
    editor.chain().focus().toggleMark("blur").run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-slate-50/80 backdrop-blur-sm rounded-t-lg select-none">
      {/* 文本层级 */}
      <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs flex items-center gap-1 ${
            editor.isActive("paragraph")
              ? "bg-slate-200 font-semibold text-slate-900"
              : "text-slate-600"
          }`}
          title="普通正文"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("heading", { level: 1 })
              ? "bg-slate-200 font-semibold text-slate-900"
              : "text-slate-600"
          }`}
          title="一级标题 (用于姓名)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("heading", { level: 2 })
              ? "bg-slate-200 font-semibold text-slate-900"
              : "text-slate-600"
          }`}
          title="二级标题 (用于模块名)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("heading", { level: 3 })
              ? "bg-slate-200 font-semibold text-slate-900"
              : "text-slate-600"
          }`}
          title="三级标题 (用于小标题)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 字符格式化 */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("bold")
              ? "bg-slate-200 font-bold text-slate-900"
              : "text-slate-600"
          }`}
          title="加粗 (Ctrl/Cmd+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("italic")
              ? "bg-slate-200 text-slate-900 italic"
              : "text-slate-600"
          }`}
          title="斜体 (Ctrl/Cmd+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("underline")
              ? "bg-slate-200 text-slate-900 underline"
              : "text-slate-600"
          }`}
          title="下划线 (Ctrl/Cmd+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("highlight")
              ? "bg-yellow-200 text-yellow-900"
              : "text-slate-600"
          }`}
          title="文本高亮"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 列表 */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("bulletList")
              ? "bg-slate-200 text-slate-900"
              : "text-slate-600"
          }`}
          title="无序列表"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("orderedList")
              ? "bg-slate-200 text-slate-900"
              : "text-slate-600"
          }`}
          title="有序列表"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 超链接与一键脱敏 */}
      <div className="flex items-center gap-0.5 px-1 border-r border-slate-200">
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded hover:bg-slate-200/80 text-xs ${
            editor.isActive("link")
              ? "bg-blue-100 text-blue-700 font-semibold"
              : "text-slate-600"
          }`}
          title="插入/修改链接"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className="p-1.5 rounded hover:bg-slate-200/80 text-xs text-rose-500"
            title="移除链接"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleBlur}
          className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
            editor.isActive("blur")
              ? "bg-purple-100 text-purple-700 font-semibold ring-1 ring-purple-300"
              : "text-slate-600 hover:bg-slate-200/80"
          }`}
          title="敏感信息脱敏（公开时自动毛玻璃模糊）"
        >
          <EyeOff className="w-3.5 h-3.5 text-purple-600" />
          <span className="text-[11px] font-medium hidden sm:inline">脱敏</span>
        </button>
      </div>

      {/* 撤销重做 */}
      <div className="flex items-center gap-0.5 pl-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-slate-200/80 text-xs text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
          title="撤销 (Ctrl/Cmd+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-slate-200/80 text-xs text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
          title="重做 (Ctrl/Cmd+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
