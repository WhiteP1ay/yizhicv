"use client";

import {
  ChevronRight,
  FileCode,
  Layers,
  Palette,
  PlusCircle,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useRightPanelResize } from "@/hooks/use-right-panel-resize";
import { useActiveEditorStore } from "@/store/active-editor";
import { useResumeStore } from "@/store/resume";
import type { RightPanelTab } from "@/types/resume";
import { DesignTokenPanel } from "./design-token-panel";
import { InsertPanel } from "./insert-panel";
import { JsonEditorPanel } from "./json-editor-panel";

interface TabItem {
  id: RightPanelTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BASE_TABS: TabItem[] = [
  {
    id: "design",
    title: "设计",
    icon: Palette,
  },
  {
    id: "insert",
    title: "插入",
    icon: PlusCircle,
  },
  {
    id: "sections",
    title: "模块",
    icon: Layers,
  },
];

export const RightPanel: React.FC = () => {
  const isJsonEditorEnabled = useResumeStore(
    (state) => state.resume.settings.isJsonEditorEnabled,
  );
  const activeTab = useResumeStore(
    (state) => state.resume.settings.rightPanelTab,
  );
  const setActiveTab = useResumeStore((state) => state.setRightPanelTab);
  const jsonWasEnabled = useRef(isJsonEditorEnabled);
  const { getEffectiveEditor, selectionTick } = useActiveEditorStore();

  const {
    width,
    isCollapsed,
    setIsCollapsed,
    isResizing,
    handlePointerDownResize,
    handleDoubleClickResize,
  } = useRightPanelResize();

  // 当在画布中选中分割线时，自动切换至「插入」tab 便于即时二次编辑
  useEffect(() => {
    void selectionTick;
    const editor = getEffectiveEditor();
    if (editor?.isActive("horizontalRule") && activeTab !== "insert") {
      setActiveTab("insert");
      setIsCollapsed(false);
    }
  }, [
    selectionTick,
    getEffectiveEditor,
    setIsCollapsed,
    activeTab,
    setActiveTab,
  ]);

  // 刚打开 JSON 编辑时切到该标签；关掉后如果还停在 JSON，回到设计
  useEffect(() => {
    if (isJsonEditorEnabled && !jsonWasEnabled.current) {
      setIsCollapsed(false);
      setActiveTab("json");
    } else if (!isJsonEditorEnabled && activeTab === "json") {
      setActiveTab("design");
    }
    jsonWasEnabled.current = isJsonEditorEnabled;
  }, [isJsonEditorEnabled, setIsCollapsed, activeTab, setActiveTab]);

  const availableTabs: TabItem[] = [
    ...BASE_TABS,
    ...(isJsonEditorEnabled
      ? [
          {
            id: "json" as const,
            title: "JSON",
            icon: FileCode,
          },
        ]
      : []),
  ];

  const handleTabClick = (tabId: RightPanelTab) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setActiveTab(tabId);
    } else if (activeTab === tabId) {
      // 再次点击当前激活的 tab 可快速折叠面板
      setIsCollapsed(true);
    } else {
      setActiveTab(tabId);
    }
  };

  return (
    <aside
      data-testid="right-panel"
      style={{ width: isCollapsed ? 56 : width }}
      className={`no-print relative h-full border-l border-slate-200 bg-white/95 backdrop-blur-md flex flex-col z-20 flex-shrink-0 select-none shadow-xs ${
        isResizing
          ? "transition-none select-none"
          : "transition-[width] duration-200 ease-in-out"
      }`}
    >
      {/* 拖拽调节宽度的左边缘分割线 (Resize Handle) */}
      <div
        data-testid="right-panel-resize-handle"
        onPointerDown={handlePointerDownResize}
        onDoubleClick={handleDoubleClickResize}
        className="absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-30 group flex items-center justify-center select-none"
        title="按住左右拖拽调节面板宽度，双击重置"
      >
        <div
          className={`w-0.5 h-full transition-all duration-150 ${
            isResizing
              ? "bg-blue-500 w-1 shadow-xs"
              : "group-hover:bg-blue-400 group-hover:w-0.5"
          }`}
        />
      </div>

      {/* Panel 顶部：圆 tab 切换区 (只放 icon，无文字) */}
      <div
        className={`h-13 px-2.5 border-b border-slate-100 flex items-center gap-1 flex-shrink-0 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <Button
                  key={tab.id}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTabClick(tab.id)}
                  className={`size-8 rounded-full transition-all duration-150 relative cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs hover:bg-slate-800 hover:text-white"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  title={tab.title}
                >
                  <Icon className="size-4" />
                </Button>
              );
            })}
          </div>
        )}

        {/* 展开/收起切换把手 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="size-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0 cursor-pointer"
          title={isCollapsed ? "展开右侧面板" : "收起面板"}
        >
          <ChevronRight
            className={`size-3.5 transition-transform duration-200 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {/* 折叠时：垂直展示圆 tab 图标，点击任一图标均可直接展开并切到对应 tab */}
      {isCollapsed && (
        <div className="flex flex-col items-center gap-2 py-3">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleTabClick(tab.id)}
                className={`size-8 rounded-full transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white shadow-xs hover:bg-slate-800 hover:text-white"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title={tab.title}
              >
                <Icon className="size-4" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Panel 内部主体：折叠时隐藏内容，展开时渲染激活 tab */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === "design" && <DesignTokenPanel />}
          {activeTab === "insert" && <InsertPanel />}
          {activeTab === "sections" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <Layers className="size-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="font-medium text-slate-600">模块结构视图</p>
              <p className="text-[11px] text-slate-400 mt-1">
                支持拖拽重排、显隐控制与跨栏调配
              </p>
            </div>
          )}
          {isJsonEditorEnabled && (
            <div
              className={`flex-1 flex-col min-h-0 overflow-hidden ${
                activeTab === "json" ? "flex" : "hidden"
              }`}
            >
              <JsonEditorPanel />
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
