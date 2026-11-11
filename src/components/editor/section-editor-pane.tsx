"use client";

import {
  Columns,
  Eye,
  EyeOff,
  HelpCircle,
  Plus,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useResumeStore } from "@/store/resume";
import { getSectionLabel, SECTION_PRESETS } from "@/types/resume";
import { TiptapEditor } from "./tiptap-editor";

export const SectionEditorPane: React.FC = () => {
  const {
    resume,
    activeSectionId,
    setActiveSectionId,
    updateSectionContent,
    setSectionSlot,
    toggleSectionVisible,
    removeSection,
    addSectionFromPreset,
  } = useResumeStore();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const activeSection =
    resume.sections.find((s) => s.id === activeSectionId) ||
    resume.sections[0] ||
    null;

  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200">
      {/* 顶部模块切换 Tabs 与快速添加 */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>模块清单 (Sections)</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
              {resume.sections.length}
            </span>
          </div>

          {/* 添加模块按钮及下拉 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>添加模块</span>
            </button>

            {isAddMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="关闭预设菜单"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setIsAddMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
                    选择预设模块
                  </div>
                  {Object.values(SECTION_PRESETS).map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        addSectionFromPreset(preset.key);
                        setIsAddMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex flex-col transition-colors"
                    >
                      <span className="text-xs font-medium text-slate-800">
                        {preset.name}
                      </span>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {preset.description}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* 模块滑动横条 Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {resume.sections.map((section, idx) => {
            const isActive = section.id === activeSection?.id;
            const label = getSectionLabel(section.content);
            const isSidebar = section.slot === "sidebar";

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`flex-shrink-0 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                    : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900"
                } ${!section.visible ? "opacity-50 line-through" : ""}`}
                title={`模块 #${idx + 1}: ${label} (${
                  isSidebar ? "侧边栏" : "主内容区"
                })`}
              >
                <span className="truncate max-w-[85px]">{label}</span>
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                    isActive
                      ? "bg-slate-800 text-slate-300"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {isSidebar ? "侧" : "主"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 当前选中模块的配置与富文本编辑区 */}
      {activeSection ? (
        <div className="flex-1 flex flex-col p-4 overflow-hidden gap-3">
          {/* 模块控制栏：槽位切换、显隐控制、删除 */}
          <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">
                {getSectionLabel(activeSection.content)}
              </span>

              {/* 槽位切换 */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setSectionSlot(activeSection.id, "main")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    activeSection.slot === "main"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="放置在主栏 (宽槽位)"
                >
                  <Square className="w-3 h-3" />
                  <span>主栏</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSectionSlot(activeSection.id, "sidebar")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                    activeSection.slot === "sidebar"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                  title="放置在侧栏 (窄槽位)"
                >
                  <Columns className="w-3 h-3" />
                  <span>侧栏</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* 可见性开关 */}
              <button
                type="button"
                onClick={() => toggleSectionVisible(activeSection.id)}
                className={`p-1.5 rounded hover:bg-slate-100 transition-colors ${
                  activeSection.visible ? "text-slate-600" : "text-amber-500"
                }`}
                title={
                  activeSection.visible ? "在画布上显示" : "当前已在画布中隐藏"
                }
              >
                {activeSection.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>

              {/* 删除当前模块 */}
              {resume.sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `确定要删除「${getSectionLabel(
                          activeSection.content,
                        )}」模块吗？`,
                      )
                    ) {
                      removeSection(activeSection.id);
                    }
                  }}
                  className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                  title="删除此模块"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tiptap 富文本核心编辑容器 */}
          <div className="flex-1 min-h-0 flex flex-col">
            <TiptapEditor
              content={activeSection.content}
              onChange={(html) => updateSectionContent(activeSection.id, html)}
              placeholder="在此输入模块标题与经历详情..."
              className="flex-1 h-full"
            />
          </div>

          {/* 底部小贴士 */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>所有修改实时同步右侧 A4 画布并自动保存</span>
            </div>
            <div className="flex items-center gap-1">
              <HelpCircle className="w-3 h-3" />
              <span>选中文本可点击「脱敏」进行高斯模糊遮盖</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <p className="text-sm">暂无内容模块，点击上方按钮添加。</p>
        </div>
      )}
    </div>
  );
};
