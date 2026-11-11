"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  Check,
  ChevronRight,
  Code2,
  Download,
  FileCode,
  FilePlus,
  Printer,
  Terminal,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useResumeFileActions } from "@/hooks/use-resume-file-actions";
import { useResumeStore } from "@/store/resume";

export const AppTopBar: React.FC = () => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // 窗口菜单状态 (含二级开发者选项 -> 勾选 JSON 编辑)
  const [isWindowMenuOpen, setIsWindowMenuOpen] = useState(false);
  const [isDevSubmenuOpen, setIsDevSubmenuOpen] = useState(false);
  const windowMenuContainerRef = useRef<HTMLDivElement>(null);

  const { isJsonEditorEnabled, toggleJsonEditor } = useResumeStore();

  const closeMenu = useCallback(() => {
    setIsFileMenuOpen(false);
    setIsExportSubmenuOpen(false);
  }, []);

  const closeWindowMenu = useCallback(() => {
    setIsWindowMenuOpen(false);
    setIsDevSubmenuOpen(false);
  }, []);

  // 1. 通用点击外部与 Esc 键自动收起菜单
  useClickOutside(menuContainerRef, closeMenu, { enabled: isFileMenuOpen });
  useClickOutside(windowMenuContainerRef, closeWindowMenu, {
    enabled: isWindowMenuOpen,
  });

  // 2. 文件操作生命周期 (新建文档、导入校验、PDF/JSON导出)
  const {
    fileInputRef,
    handleNew,
    triggerImport,
    handleFileChange,
    exportPdf,
    exportJson,
  } = useResumeFileActions({ onActionComplete: closeMenu });

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

      {/* 1. 左侧：品牌与文件菜单 */}
      <div className="flex items-center gap-1">
        <Link
          href="/"
          title="返回官网首页"
          className="h-7 px-2 flex items-center text-xs font-bold text-slate-900 tracking-tight hover:opacity-75 transition-opacity select-none"
        >
          一纸简历
        </Link>

        {/* 品牌与菜单分隔线 */}
        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        {/* 核心文件菜单 (支持新建、导入、导出 -> 导出PDF/JSON) */}
        <div className="relative flex items-center" ref={menuContainerRef}>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsFileMenuOpen((prev) => !prev);
              setIsExportSubmenuOpen(false);
            }}
            className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors ${
              isFileMenuOpen
                ? "bg-slate-200 text-slate-900"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            文件
          </Button>

          {isFileMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* 新建 */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleNew}
                className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md"
              >
                <FilePlus className="w-3.5 h-3.5 text-slate-500" />
                <span>新建</span>
              </Button>

              {/* 导入 JSON */}
              <Button
                type="button"
                variant="ghost"
                onClick={triggerImport}
                className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>导入 JSON</span>
              </Button>

              <div className="h-px bg-slate-100 my-1" />

              {/* 导出 (带有二级子菜单：导出 PDF / 导出 JSON) */}
              <div
                className="relative group/submenu"
                onMouseEnter={() => setIsExportSubmenuOpen(true)}
                onMouseLeave={() => setIsExportSubmenuOpen(false)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsExportSubmenuOpen((prev) => !prev)}
                  className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>导出</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Button>

                {/* 二级子菜单 - 增加无缝衔接防丢焦 */}
                {isExportSubmenuOpen && (
                  <div className="absolute left-full top-0 -ml-1 pl-1 w-40 z-50">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={exportPdf}
                        className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>导出 PDF</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={exportJson}
                        className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-500" />
                        <span>导出 JSON</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 窗口菜单 (含二级开发者选项 -> 勾选 JSON 编辑) */}
        <div
          className="relative flex items-center"
          ref={windowMenuContainerRef}
        >
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsWindowMenuOpen((prev) => !prev);
              setIsDevSubmenuOpen(false);
              setIsFileMenuOpen(false);
            }}
            className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors ${
              isWindowMenuOpen
                ? "bg-slate-200 text-slate-900"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            窗口
          </Button>

          {isWindowMenuOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {/* 开发者 (带有二级子菜单：JSON 编辑勾选) */}
              <div
                className="relative group/devsubmenu"
                onMouseEnter={() => setIsDevSubmenuOpen(true)}
                onMouseLeave={() => setIsDevSubmenuOpen(false)}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsDevSubmenuOpen((prev) => !prev)}
                  className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-slate-500" />
                    <span>开发者</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </Button>

                {/* 二级开发者子菜单 */}
                {isDevSubmenuOpen && (
                  <div className="absolute left-full top-0 -ml-1 pl-1 w-44 z-50">
                    <div className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-100">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          toggleJsonEditor();
                          closeWindowMenu();
                        }}
                        className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>JSON 编辑</span>
                        </div>
                        {isJsonEditorEnabled ? (
                          <div className="size-4 rounded bg-blue-600 text-white flex items-center justify-center">
                            <Check className="size-3 stroke-[2.5]" />
                          </div>
                        ) : (
                          <div className="size-4 rounded border border-slate-300" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. 中间：纯净留白 */}
      <div />

      {/* 3. 右侧：GitHub */}
      <div className="flex items-center gap-1.5">
        {/* GitHub 链接 */}
        <a
          href="https://github.com/WhiteP1ay/yizhicv"
          target="_blank"
          rel="noopener noreferrer"
          className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="GitHub 开源仓库"
        >
          <SiGithub className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
