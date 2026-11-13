"use client";

import { SiGithub } from "@icons-pack/react-simple-icons";
import {
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
import { AccountMenu } from "@/components/layout/account-menu";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Separator } from "@/components/ui/separator";
import { useResumeFileActions } from "@/hooks/use-resume-file-actions";
import { useResumeHistory } from "@/hooks/use-resume-history";
import { useResumeStore } from "@/store/resume";

export const AppTopBar: React.FC = () => {
  const { canUndo, canRedo, undo, redo, undoShortcut, redoShortcut } =
    useResumeHistory();

  const { toggleJsonEditor, toggleBlurMode, setImageTrayOpen, resume } =
    useResumeStore();
  const { isJsonEditorEnabled, isBlurMode, imageTrayOpen } = resume.settings;

  const {
    fileInputRef,
    handleNew,
    handleClear,
    triggerImport,
    handleFileChange,
    exportPdf,
    exportJson,
  } = useResumeFileActions();

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
        <Separator
          orientation="vertical"
          className="h-3.5 mx-0.5 bg-slate-200"
        />

        {/* 桌面级菜单栏 (shadcn Menubar 原生提供点击展开、悬停切换、键盘导航与子菜单能力) */}
        <Menubar
          data-testid="top-menu-bar"
          className="h-auto border-none bg-transparent p-0 gap-0.5 shadow-none"
        >
          {/* 文件菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2.5 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900 cursor-pointer">
              文件
            </MenubarTrigger>
            <MenubarContent className="min-w-44 text-xs">
              <MenubarItem
                onClick={handleNew}
                className="text-xs gap-2 cursor-pointer"
              >
                <FilePlus className="size-3.5 text-slate-500" />
                <span>新建</span>
              </MenubarItem>

              <MenubarItem
                onClick={handleClear}
                className="text-xs gap-2 cursor-pointer text-slate-700 focus:text-red-600 focus:bg-red-50"
              >
                <Trash2 className="size-3.5 text-slate-400 group-focus/menubar-item:text-red-500" />
                <span>清空</span>
              </MenubarItem>

              <MenubarSeparator />

              <MenubarItem
                onClick={triggerImport}
                className="text-xs gap-2 cursor-pointer"
              >
                <Upload className="size-3.5 text-slate-500" />
                <span>导入 JSON</span>
              </MenubarItem>

              <MenubarSeparator />

              <MenubarSub>
                <MenubarSubTrigger className="text-xs gap-2 cursor-pointer">
                  <Download className="size-3.5 text-slate-500" />
                  <span>导出</span>
                </MenubarSubTrigger>
                <MenubarSubContent className="min-w-36 text-xs">
                  <MenubarItem
                    onClick={exportPdf}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <Printer className="size-3.5 text-slate-500" />
                    <span>导出 PDF</span>
                  </MenubarItem>
                  <MenubarItem
                    onClick={exportJson}
                    className="text-xs gap-2 cursor-pointer"
                  >
                    <FileCode className="size-3.5 text-slate-500" />
                    <span>导出 JSON</span>
                  </MenubarItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>

          {/* 编辑菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2.5 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900 cursor-pointer">
              编辑
            </MenubarTrigger>
            <MenubarContent className="min-w-48 text-xs">
              <MenubarItem
                disabled={!canUndo}
                onClick={undo}
                className="text-xs gap-2 cursor-pointer"
              >
                <Undo2 className="size-3.5 text-slate-500" />
                <span>撤销</span>
                <MenubarShortcut>{undoShortcut}</MenubarShortcut>
              </MenubarItem>

              <MenubarItem
                disabled={!canRedo}
                onClick={redo}
                className="text-xs gap-2 cursor-pointer"
              >
                <Redo2 className="size-3.5 text-slate-500" />
                <span>重做</span>
                <MenubarShortcut>{redoShortcut}</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 显示菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2.5 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900 cursor-pointer">
              显示
            </MenubarTrigger>
            <MenubarContent className="min-w-48 text-xs">
              <MenubarCheckboxItem
                checked={isBlurMode}
                onCheckedChange={toggleBlurMode}
                className="text-xs cursor-pointer"
              >
                <EyeOff className="size-3.5 text-slate-500 mr-1" />
                <span>隐藏敏感内容</span>
              </MenubarCheckboxItem>
            </MenubarContent>
          </MenubarMenu>

          {/* 窗口菜单 */}
          <MenubarMenu>
            <MenubarTrigger className="h-7 px-2.5 text-xs font-medium rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 data-[state=open]:bg-slate-200 data-[state=open]:text-slate-900 cursor-pointer">
              窗口
            </MenubarTrigger>
            <MenubarContent className="min-w-44 text-xs">
              <MenubarCheckboxItem
                checked={imageTrayOpen}
                onCheckedChange={(checked) => setImageTrayOpen(checked)}
                className="text-xs cursor-pointer"
              >
                <span>备选</span>
              </MenubarCheckboxItem>
              <MenubarSub>
                <MenubarSubTrigger className="text-xs gap-2 cursor-pointer">
                  <Terminal className="size-3.5 text-slate-500" />
                  <span>开发者</span>
                </MenubarSubTrigger>
                <MenubarSubContent className="min-w-40 text-xs">
                  <MenubarCheckboxItem
                    checked={isJsonEditorEnabled}
                    onCheckedChange={toggleJsonEditor}
                    className="text-xs cursor-pointer"
                  >
                    <Code2 className="size-3.5 text-slate-500 mr-1" />
                    <span>JSON 编辑</span>
                  </MenubarCheckboxItem>
                </MenubarSubContent>
              </MenubarSub>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>

      {/* 2. 中间：纯净留白 */}
      <div />

      {/* 3. 右侧：账号与 GitHub */}
      <div className="flex items-center gap-1.5">
        <AccountMenu />
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
