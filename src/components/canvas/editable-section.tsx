"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { GripVertical, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { CanvasBubbleMenu } from "@/components/editor/bubble-menu";
import { BlurMark } from "@/components/editor/extensions/blur-mark";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume";
import type { ResumeSection } from "@/types/resume";

interface EditableSectionProps {
  section: ResumeSection;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  section,
}) => {
  const {
    updateSectionContent,
    removeSection,
    setActiveSectionId,
    activeSectionId,
    resume,
  } = useResumeStore();

  // dnd-kit 拖拽排序集成
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Highlight.configure({ multicolor: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "cv-link text-blue-600 underline hover:text-blue-800",
        },
      }),
      Placeholder.configure({
        placeholder: "点击输入模块标题或正文...",
      }),
      BlurMark,
      BubbleMenuExtension,
    ],
    content: section.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "cv-inline-editor focus:outline-none min-h-[30px] prose prose-slate max-w-none text-slate-800 leading-normal",
      },
    },
    onFocus: () => {
      setActiveSectionId(section.id);
    },
    onUpdate: ({ editor }) => {
      updateSectionContent(section.id, editor.getHTML());
    },
  });

  // 外部 content 变化时同步内容
  useEffect(() => {
    if (editor && section.content !== editor.getHTML()) {
      editor.commands.setContent(section.content, { emitUpdate: false });
    }
  }, [section.content, editor]);

  const isActive = activeSectionId === section.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cv-section-container relative group rounded transition-all duration-150 ${
        isActive
          ? "ring-1 ring-blue-500/40 bg-blue-50/10"
          : "hover:ring-1 hover:ring-slate-300/80"
      }`}
    >
      {/* 悬停把手控制栏 (仅拖拽把手与删除，打印时隐藏) */}
      <div className="no-print absolute -top-3.5 right-1 z-30 hidden group-hover:flex items-center gap-1 bg-slate-900/90 text-white px-1.5 py-0.5 rounded-full text-[10px] shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
        {/* 拖拽把手 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          {...attributes}
          {...listeners}
          className="h-5 w-5 p-0 hover:bg-slate-700/80 rounded cursor-grab active:cursor-grabbing text-slate-300 hover:text-white transition-colors"
          title="按住拖拽调整模块顺序或跨栏移动"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </Button>

        {/* 删除模块 */}
        {resume.sections.length > 1 && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              if (window.confirm("确定要删除当前模块吗？")) {
                removeSection(section.id);
              }
            }}
            className="h-5 w-5 p-0 hover:bg-rose-600/80 text-rose-300 hover:text-white rounded transition-colors"
            title="删除此模块"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* 选中文本时的悬浮气泡菜单 */}
      {editor && <CanvasBubbleMenu editor={editor} />}

      {/* Tiptap 渲染的正文编辑器 */}
      <EditorContent editor={editor} />
    </div>
  );
};
