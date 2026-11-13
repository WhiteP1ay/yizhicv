"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Placeholder from "@tiptap/extension-placeholder";
import { TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { GripVertical, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import { CanvasBubbleMenu } from "@/components/editor/bubble-menu";
import { BlurMark } from "@/components/editor/extensions/blur-mark";
import { CustomDivider } from "@/components/editor/extensions/custom-divider";
import {
  ResumeBlockImage,
  ResumeInlineImage,
} from "@/components/editor/extensions/resume-image";
import { ResumeTable } from "@/components/editor/extensions/side-layout";
import { StoredImageDelete } from "@/components/editor/extensions/stored-image-delete";
import { Button } from "@/components/ui/button";
import { useActiveEditorStore } from "@/store/active-editor";
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
  const {
    setActiveEditor,
    notifySelectionUpdate,
    registerEditor,
    unregisterEditor,
  } = useActiveEditorStore();

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
        horizontalRule: false, // 禁用默认 hr，使用支持高度与颜色的 CustomDivider
        link: false, // 纸质简历排版不需要超链接扩展，消除重名警告与非预期样式
        trailingNode: false, // 禁用强制末尾追加空白段落，防止列表后产生无法删除的空白行
      }),
      CustomDivider,
      ResumeTable,
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: "点击输入模块标题或正文...",
      }),
      BlurMark,
      ResumeBlockImage,
      ResumeInlineImage,
      StoredImageDelete,
      BubbleMenuExtension,
    ],
    content: section.content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "cv-inline-editor focus:outline-none min-h-[30px] prose prose-slate max-w-none text-slate-800",
      },
    },
    onFocus: () => {
      setActiveSectionId(section.id);
      setActiveEditor(editor, section.id);
    },
    onSelectionUpdate: () => {
      notifySelectionUpdate();
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

  // 注册全局编辑器映射，便于面板跨模块触发插入
  useEffect(() => {
    if (editor) {
      registerEditor(section.id, editor);
      return () => {
        unregisterEditor(section.id);
      };
    }
  }, [editor, section.id, registerEditor, unregisterEditor]);

  // 当当前模块被置为活跃模块时，更新全局 activeEditor
  useEffect(() => {
    if (editor && activeSectionId === section.id) {
      setActiveEditor(editor, section.id);
    }
  }, [activeSectionId, editor, section.id, setActiveEditor]);

  // 激活态：当前模块被置为活跃模块
  const isActive = activeSectionId === section.id;

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-section-id={section.id}
      onPointerDown={() => {
        if (activeSectionId !== section.id) {
          setActiveSectionId(section.id);
          if (editor) {
            setActiveEditor(editor, section.id);
          }
        }
      }}
      className={`cv-section-container relative group rounded transition-all duration-150 ${
        isActive
          ? "ring-1 ring-blue-500/40 bg-blue-50/10"
          : "hover:ring-1 hover:ring-slate-300/60"
      }`}
    >
      {/* 悬停与激活把手控制栏 (仅拖拽把手与删除，打印时隐藏) */}
      <div
        className={`no-print absolute -top-9 right-1 z-30 ${
          isActive ? "flex" : "hidden group-hover:flex"
        } items-center gap-0.5 p-1 bg-slate-900/95 backdrop-blur-md text-white rounded-lg shadow-xl border border-slate-700/60 animate-in fade-in zoom-in-95 duration-100`}
      >
        {/* 拖拽把手 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          {...attributes}
          {...listeners}
          className="h-7 w-7 p-0 hover:bg-slate-700/80 rounded cursor-grab active:cursor-grabbing text-slate-300 hover:text-white transition-colors"
          title="按住拖拽调整模块顺序或跨栏移动"
        >
          <GripVertical className="size-3.5" />
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
            className="h-7 w-7 p-0 hover:bg-rose-600/80 text-rose-300 hover:text-white rounded transition-colors"
            title="删除此模块"
          >
            <Trash2 className="size-3.5" />
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
