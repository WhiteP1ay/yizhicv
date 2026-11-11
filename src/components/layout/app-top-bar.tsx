"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
  Check,
  ChevronRight,
  Code2,
  Download,
  EyeOff,
  FileCode,
  FilePlus,
  Printer,
  Redo2,
  Terminal,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useResumeFileActions } from "@/hooks/use-resume-file-actions";
import { useResumeHistory } from "@/hooks/use-resume-history";
import { useResumeStore } from "@/store/resume";

type TopBarMenuId = "file" | "edit" | "view" | "window";

export const AppTopBar: React.FC = () => {
  const { canUndo, canRedo, undo, redo, undoShortcut, redoShortcut } =
    useResumeHistory();

  // 统一顶层激活菜单状态 (null 表示关闭闲置态，非空表示菜单模式已激活)
  const [activeMenu, setActiveMenu] = useState<TopBarMenuId | null>(null);
  const [isExportSubmenuOpen, setIsExportSubmenuOpen] = useState(false);
  const [isDevSubmenuOpen, setIsDevSubmenuOpen] = useState(false);

  // 整个菜单栏统一监听容器
  const menuBarRef = useRef<HTMLDivElement>(null);

  const { isJsonEditorEnabled, toggleJsonEditor, isBlurMode, toggleBlurMode } =
    useResumeStore();

  const closeAllMenus = useCallback(() => {
    setActiveMenu(null);
    setIsExportSubmenuOpen(false);
    setIsDevSubmenuOpen(false);
  }, []);

  // 1. 通用点击菜单栏外部或按 Esc 键自动收起菜单
  useClickOutside(menuBarRef, closeAllMenus, { enabled: activeMenu !== null });

  // 2. 菜单项点击交互：未展开时点击打开；已展开当前菜单时点击收起
  const handleTriggerClick = (menuId: TopBarMenuId) => {
    if (activeMenu === menuId) {
      closeAllMenus();
    } else {
      setActiveMenu(menuId);
      setIsExportSubmenuOpen(false);
      setIsDevSubmenuOpen(false);
    }
  };

  // 3. 鼠标划过自动切换（桌面级菜单栏手感核心：只要处于激活展开状态，划过其他菜单项即刻自动切换）
  const handleTriggerMouseEnter = (menuId: TopBarMenuId) => {
    if (activeMenu !== null && activeMenu !== menuId) {
      setActiveMenu(menuId);
      setIsExportSubmenuOpen(false);
      setIsDevSubmenuOpen(false);
    }
  };

  // 4. 文件操作生命周期 (新建文档、清空缓存、导入校验、PDF/JSON导出)
  const {
    fileInputRef,
    handleNew,
    handleClear,
    triggerImport,
    handleFileChange,
    exportPdf,
    exportJson,
  } = useResumeFileActions({ onActionComplete: closeAllMenus });

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

      {/* 1. 左侧：品牌与菜单栏 */}
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

        {/* 桌面级菜单栏 (支持点击展开后，鼠标划过即刻自动展开其他项) */}
        <div
          ref={menuBarRef}
          data-testid="top-menu-bar"
          className="flex items-center gap-0.5"
        >
          {/* 文件菜单 */}
          <div className="relative flex items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTriggerClick("file")}
              onMouseEnter={() => handleTriggerMouseEnter("file")}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeMenu === "file"
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              文件
            </Button>

            {activeMenu === "file" && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75 text-xs">
                {/* 新建 */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleNew}
                  className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md cursor-pointer"
                >
                  <FilePlus className="w-3.5 h-3.5 text-slate-500" />
                  <span>新建</span>
                </Button>

                {/* 清空（新建下增加清空功能，彻底清除本地缓存与当前内容） */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClear}
                  className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-red-50 hover:text-red-600 gap-2 rounded-md cursor-pointer group"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                  <span>清空</span>
                </Button>

                <div className="h-px bg-slate-100 my-1" />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={triggerImport}
                  className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md cursor-pointer"
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
                    className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md cursor-pointer"
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
                      <div className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-75">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={exportPdf}
                          className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          <span>导出 PDF</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={exportJson}
                          className="w-full h-8 px-3 justify-start text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 gap-2 rounded-md cursor-pointer"
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

          {/* 编辑菜单 */}
          <div className="relative flex items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTriggerClick("edit")}
              onMouseEnter={() => handleTriggerMouseEnter("edit")}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeMenu === "edit"
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              编辑
            </Button>

            {activeMenu === "edit" && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75 text-xs">
                {/* 撤销 */}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canUndo}
                  onClick={() => {
                    undo();
                    closeAllMenus();
                  }}
                  className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>撤销</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {undoShortcut}
                  </span>
                </Button>

                {/* 重做 */}
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canRedo}
                  onClick={() => {
                    redo();
                    closeAllMenus();
                  }}
                  className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Redo2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>重做</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {redoShortcut}
                  </span>
                </Button>
              </div>
            )}
          </div>

          {/* 显示菜单 */}
          <div className="relative flex items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTriggerClick("view")}
              onMouseEnter={() => handleTriggerMouseEnter("view")}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeMenu === "view"
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              显示
            </Button>

            {activeMenu === "view" && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75 text-xs">
                {/* 隐藏敏感内容 */}
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    toggleBlurMode();
                    closeAllMenus();
                  }}
                  className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                    <span>隐藏敏感内容</span>
                  </div>
                  {isBlurMode ? (
                    <div className="size-4 rounded bg-blue-600 text-white flex items-center justify-center">
                      <Check className="size-3 stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="size-4 rounded border border-slate-300" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* 窗口菜单 */}
          <div className="relative flex items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleTriggerClick("window")}
              onMouseEnter={() => handleTriggerMouseEnter("window")}
              className={`h-7 px-2.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeMenu === "window"
                  ? "bg-slate-200 text-slate-900"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              窗口
            </Button>

            {activeMenu === "window" && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-75 text-xs">
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
                    className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md cursor-pointer"
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
                      <div className="bg-white border border-slate-200 rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95 duration-75">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            toggleJsonEditor();
                            closeAllMenus();
                          }}
                          className="w-full h-8 px-3 justify-between text-xs font-normal text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-md cursor-pointer"
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
      </div>

      {/* 2. 中间：纯净留白 */}
      <div />

      {/* 3. 右侧：GitHub */}
      <div className="flex items-center gap-1.5">
        <a
          href="https://github.com/WhiteP1ay/yizhicv"
          target="_blank"
          rel="noopener noreferrer"
          className="h-7 w-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          title="GitHub 开源仓库"
        >
          <SiGithub className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
};
