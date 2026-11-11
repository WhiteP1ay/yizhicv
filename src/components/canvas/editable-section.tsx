"use client";

import BubbleMenuExtension from "@tiptap/extension-bubble-menu";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowDown,
  ArrowUp,
  Columns,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { BlurMark } from "@/components/editor/extensions/blur-mark";
import { useResumeStore } from "@/store/resume";
import type { ResumeSection } from "@/types/resume";
import { SECTION_PRESETS } from "@/types/resume";
import { CanvasBubbleMenu } from "./bubble-menu";

interface EditableSectionProps {
  section: ResumeSection;
}

export const EditableSection: React.FC<EditableSectionProps> = ({
  section,
}) => {
  const {
    updateSectionContent,
    setSectionSlot,
    removeSection,
    moveSectionUp,
    moveSectionDown,
    addSectionFromPreset,
    setActiveSectionId,
    activeSectionId,
    resume,
  } = useResumeStore();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

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

  // 外部 content 变化时（如重置或撤销）同步内容
  useEffect(() => {
    if (editor && section.content !== editor.getHTML()) {
      editor.commands.setContent(section.content, { emitUpdate: false });
    }
  }, [section.content, editor]);

  const isActive = activeSectionId === section.id;

  return (
    <div
      className={`cv-section-container relative group rounded transition-all duration-150 ${
        isActive
          ? "ring-1 ring-blue-500/50 bg-blue-50/10"
          : "hover:ring-1 hover:ring-slate-300/80"
      }`}
    >
      {/* 悬停微控手柄栏 (打印时自动隐藏) */}
      <div className="no-print absolute -top-3.5 right-1 z-30 hidden group-hover:flex items-center gap-0.5 bg-slate-900/90 text-white px-1.5 py-0.5 rounded-full text-[10px] shadow-lg backdrop-blur-sm animate-in fade-in zoom-in-95 duration-100">
        {/* 槽位切换 */}
        <button
          type="button"
          onClick={() =>
            setSectionSlot(
              section.id,
              section.slot === "main" ? "sidebar" : "main",
            )
          }
          className="p-1 hover:bg-slate-700/80 rounded-full transition-colors flex items-center gap-0.5"
          title={
            section.slot === "main"
              ? "移到侧边栏 (Narrow Slot)"
              : "移到主栏 (Wide Slot)"
          }
        >
          {section.slot === "main" ? (
            <>
              <Columns className="w-2.5 h-2.5 text-blue-300" />
              <span>转侧栏</span>
            </>
          ) : (
            <>
              <Square className="w-2.5 h-2.5 text-emerald-300" />
              <span>转主栏</span>
            </>
          )}
        </button>

        <span className="w-px h-2.5 bg-slate-700 mx-0.5" />

        {/* 上移 / 下移 */}
        <button
          type="button"
          onClick={() => moveSectionUp(section.id)}
          className="p-1 hover:bg-slate-700/80 rounded-full transition-colors"
          title="上移"
        >
          <ArrowUp className="w-2.5 h-2.5" />
        </button>
        <button
          type="button"
          onClick={() => moveSectionDown(section.id)}
          className="p-1 hover:bg-slate-700/80 rounded-full transition-colors"
          title="下移"
        >
          <ArrowDown className="w-2.5 h-2.5" />
        </button>

        <span className="w-px h-2.5 bg-slate-700 mx-0.5" />

        {/* 在此下方添加新模块 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className="p-1 hover:bg-slate-700/80 rounded-full transition-colors flex items-center gap-0.5"
            title="在此下方插入模块"
          >
            <Plus className="w-2.5 h-2.5 text-amber-300" />
            <span>插入</span>
          </button>

          {isAddMenuOpen && (
            <>
              <button
                type="button"
                aria-label="关闭选择菜单"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsAddMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-44 bg-white text-slate-800 border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  选择预设模块
                </div>
                {Object.values(SECTION_PRESETS).map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => {
                      addSectionFromPreset(
                        preset.key,
                        section.slot,
                        section.id,
                      );
                      setIsAddMenuOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 hover:bg-slate-50 text-left text-xs text-slate-700 hover:text-slate-900 block"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 删除模块 */}
        {resume.sections.length > 1 && (
          <>
            <span className="w-px h-2.5 bg-slate-700 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                if (window.confirm("确定要删除当前模块吗？")) {
                  removeSection(section.id);
                }
              }}
              className="p-1 hover:bg-rose-600/80 text-rose-300 hover:text-white rounded-full transition-colors"
              title="删除此模块"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </>
        )}
      </div>

      {/* 选中文本时的悬浮气泡菜单 */}
      {editor && <CanvasBubbleMenu editor={editor} />}

      {/* Tiptap 渲染的正文编辑器 */}
      <EditorContent editor={editor} />
    </div>
  );
};
