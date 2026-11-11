"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  ChevronRight,
  Download,
  FileCode,
  FilePlus,
  FileText,
  Printer,
  Upload,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { useResumeStore } from "@/store/resume";
import { getResumeExportName, yizhiResumeSchema } from "@/types/resume";

export const AppTopBar: React.FC = () => {
  const { resume, setTitle, createNewResume, importResume } = useResumeStore();

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(resume.metadata.title);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 新建简历
  const handleNew = () => {
    setIsFileMenuOpen(false);
    setIsExportSubmenuOpen(false);
    if (window.confirm("确定要新建一份简历吗？当前未导出的修改将被覆盖。")) {
      createNewResume();
    }
  };

  // 2. 导入 JSON 文件
  const handleTriggerImport = () => {
    setIsFileMenuOpen(false);
    setIsExportSubmenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const parsed = yizhiResumeSchema.safeParse(raw);

        if (parsed.success) {
          importResume(parsed.data);
          alert("简历导入成功！");
        } else {
          // 尝试宽松兼容
          if (raw && Array.isArray(raw.sections)) {
            const normalized = {
              ...resume,
              ...raw,
              metadata: {
                ...resume.metadata,
                ...(raw.metadata || {}),
                updatedAt: new Date().toISOString(),
              },
            };
            importResume(normalized);
            alert("简历已兼容导入！");
          } else {
            alert("导入失败：文件格式不符合一纸简历规范。");
          }
        }
      } catch {
        alert("导入失败：无效的 JSON 文件。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 3. 导出 PDF
  const handleExportPdf = () => {
    setIsFileMenuOpen(false);
    setIsExportSubmenuOpen(false);
    window.print();
  };

  // 4. 导出 JSON
  const handleExportJson = () => {
    setIsFileMenuOpen(false);
    setIsExportSubmenuOpen(false);
    const jsonString = JSON.stringify(resume, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const fileName = `${getResumeExportName(resume)}.json`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setTitle(titleInput.trim());
    } else {
      setTitleInput(resume.metadata.title);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="no-print h-11 px-3 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-30 select-none shadow-2xs">
      {/* 隐藏的文件上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. 左侧：品牌微标与文件菜单 */}
      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 px-2 py-1 text-slate-900 font-bold text-xs tracking-tight">
          <FileText className="w-3.5 h-3.5" />
          <span>一纸简历</span>
        </div>

        {/* 核心文件菜单 (支持新建、导入、导出 -> 导出PDF/JSON) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsFileMenuOpen(!isFileMenuOpen);
              setIsExportSubmenuOpen(false);
            }}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              isFileMenuOpen
                ? "bg-slate-200 text-slate-900"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            文件
          </button>

          {isFileMenuOpen && (
            <>
              {/* 点击外部关闭 */}
              <button
                type="button"
                aria-label="关闭文件菜单"
                className="fixed inset-0 z-40 cursor-default"
                onClick={() => {
                  setIsFileMenuOpen(false);
                  setIsExportSubmenuOpen(false);
                }}
              />

              {/* 一级菜单下拉 */}
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {/* 新建 */}
                <button
                  type="button"
                  onClick={handleNew}
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5 text-slate-500" />
                  <span>新建</span>
                </button>

                {/* 导入 JSON */}
                <button
                  type="button"
                  onClick={handleTriggerImport}
                  className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>导入 JSON</span>
                </button>

                <div className="h-px bg-slate-100 my-1" />

                {/* 导出 (带有二级子菜单：导出 PDF / 导出 JSON) */}
                <div
                  className="relative group/submenu"
                  onMouseEnter={() => setIsExportSubmenuOpen(true)}
                  onMouseLeave={() => setIsExportSubmenuOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsExportSubmenuOpen(!isExportSubmenuOpen)}
                    className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>导出</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </button>

                  {/* 二级子菜单 */}
                  {isExportSubmenuOpen && (
                    <div className="absolute left-full top-0 ml-0.5 w-40 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={handleExportPdf}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>导出 PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>导出 JSON</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2. 中间：简历标题微调 (点击改名) */}
      <div className="flex items-center">
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
            className="text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900 w-44 text-center"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setTitleInput(resume.metadata.title);
              setIsEditingTitle(true);
            }}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-2 py-0.5 rounded transition-colors"
            title="点击重命名简历"
          >
            <span>{resume.metadata.title}</span>
          </button>
        )}
      </div>

      {/* 3. 右侧：GitHub */}
      <div className="flex items-center gap-1.5">
        {/* GitHub 链接 */}
        <a
          href="https://github.com/WhiteP1ay/yizhicv"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
          title="GitHub 开源仓库"
        >
          <SiGithub className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
