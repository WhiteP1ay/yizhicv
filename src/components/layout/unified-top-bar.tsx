"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  Check,
  FileText,
  Printer,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useResumeStore } from "@/store/resume";

const THEME_COLORS = [
  { name: "极简暗石 (Slate)", value: "#0f172a" },
  { name: "商务深蓝 (Blue)", value: "#1e40af" },
  { name: "自然松绿 (Emerald)", value: "#065f46" },
  { name: "典雅深紫 (Violet)", value: "#5b21b6" },
  { name: "纯黑原色 (Black)", value: "#000000" },
];

export const UnifiedTopBar: React.FC = () => {
  const {
    resume,
    isBlurMode,
    previewScale,
    setTitle,
    setThemeColor,
    setSidebarWidth,
    toggleBlurMode,
    setPreviewScale,
    resetResume,
  } = useResumeStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(resume.metadata.title);
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setTitle(titleInput.trim());
    } else {
      setTitleInput(resume.metadata.title);
    }
    setIsEditingTitle(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="no-print h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-30 select-none shadow-xs">
      {/* 1. 左侧：Logo 与标题 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-slate-900">
                一纸简历
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.2 rounded font-medium">
                v2.0
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              纯粹所见即所得 · A4 画布
            </span>
          </div>
        </div>

        {/* 简历文档标题重命名 */}
        <div className="pl-4 ml-2 border-l border-slate-200 flex items-center">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTitleInput(resume.metadata.title);
                  setIsEditingTitle(false);
                }
              }}
              className="text-xs font-medium text-slate-800 bg-slate-100 px-2 py-1 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 w-44"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(resume.metadata.title);
                setIsEditingTitle(true);
              }}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2 py-1 rounded transition-colors"
              title="点击重命名简历"
            >
              <span>{resume.metadata.title}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 中间：侧栏宽度调节滑块 */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <Sliders className="w-3.5 h-3.5 text-slate-400" />
        <span>侧栏:</span>
        <input
          type="range"
          min={0}
          max={360}
          step={10}
          value={resume.layout.sidebarWidth}
          onChange={(e) => setSidebarWidth(Number(e.target.value))}
          className="w-24 accent-slate-900 cursor-pointer"
          title={`侧栏宽度: ${resume.layout.sidebarWidth}px (${
            resume.layout.sidebarWidth === 0 ? "已折叠为单栏" : "双栏模式"
          })`}
        />
        <span className="font-mono text-slate-500 w-10 text-right">
          {resume.layout.sidebarWidth === 0
            ? "单栏"
            : `${resume.layout.sidebarWidth}px`}
        </span>
      </div>

      {/* 3. 右侧：主题色、缩放、脱敏预览与导出按钮 */}
      <div className="flex items-center gap-2">
        {/* 主题色选择器 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsColorMenuOpen(!isColorMenuOpen)}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-1.5 transition-colors border border-slate-200"
            title="选择主题主色"
          >
            <span
              className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
              style={{ backgroundColor: resume.design.themeColor }}
            />
            <span className="hidden sm:inline">主题色</span>
          </button>

          {isColorMenuOpen && (
            <>
              <button
                type="button"
                aria-label="关闭颜色选择菜单"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => setIsColorMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  精选主题色
                </div>
                {THEME_COLORS.map((color) => {
                  const isSelected = resume.design.themeColor === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => {
                        setThemeColor(color.value);
                        setIsColorMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-slate-700">{color.name}</span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-slate-900" />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* 脱敏模式开关 */}
        <button
          type="button"
          onClick={toggleBlurMode}
          className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-all ${
            isBlurMode
              ? "bg-purple-600 text-white shadow-xs ring-1 ring-purple-600"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
          }`}
          title="开启后，所有标记为脱敏的信息将自动应用高斯毛玻璃遮盖（适合公开分享截图）"
        >
          {isBlurMode ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>脱敏保护中</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">脱敏预览</span>
            </>
          )}
        </button>

        {/* 画布缩放控制器 */}
        <div className="hidden md:flex items-center bg-slate-100 rounded-md p-0.5 border border-slate-200">
          <button
            type="button"
            onClick={() => setPreviewScale(previewScale - 0.1)}
            className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-[11px] font-mono text-slate-700 min-w-[38px] text-center">
            {Math.round(previewScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setPreviewScale(previewScale + 0.1)}
            className="p-1 rounded hover:bg-white text-slate-600 transition-colors"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 重置 */}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "确定要重置当前简历吗？这将会清空当前修改并恢复默认模板。",
              )
            ) {
              resetResume();
            }
          }}
          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
          title="重置为默认初始模板"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* 原生打印 / 导出 PDF */}
        <button
          type="button"
          onClick={handlePrint}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-sm transition-colors"
          title="调起系统打印或直接另存为矢量 PDF"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>导出 PDF</span>
        </button>

        {/* GitHub 链接 */}
        <a
          href="https://github.com/WhiteP1ay/yizhicv"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors ml-1"
          title="GitHub 开源仓库"
        >
          <SiGithub className="w-4 h-4" />
        </a>
      </div>
    </header>
  );
};
