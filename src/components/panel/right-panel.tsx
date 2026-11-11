"use client";

import { ChevronRight, FileCode, Layers, Palette } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume";
import { DesignTokenPanel } from "./design-token-panel";
import { JsonEditorPanel } from "./json-editor-panel";

type PanelTab = "design" | "sections" | "json";

interface TabItem {
  id: PanelTab;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BASE_TABS: TabItem[] = [
  {
    id: "design",
    title: "设计与排版 Token",
    icon: Palette,
  },
  {
    id: "sections",
    title: "模块结构管理",
    icon: Layers,
  },
];

export const RightPanel: React.FC = () => {
  const { isJsonEditorEnabled } = useResumeStore();
  const [activeTab, setActiveTab] = useState<PanelTab | null>("design");
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 当开启 JSON 编辑器时，若当前收起则自动展开并切换到 json tab；关闭时回退到 design
  useEffect(() => {
    if (isJsonEditorEnabled) {
      setIsCollapsed(false);
      setActiveTab("json");
    } else {
      setActiveTab((prev) => (prev === "json" ? "design" : prev));
    }
  }, [isJsonEditorEnabled]);

  const availableTabs: TabItem[] = [
    ...BASE_TABS,
    ...(isJsonEditorEnabled
      ? [
          {
            id: "json" as const,
            title: "JSON 数据结构编辑",
            icon: FileCode,
          },
        ]
      : []),
  ];

  const handleTabClick = (tabId: PanelTab) => {
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
      className={`no-print h-full border-l border-slate-200 bg-white/95 backdrop-blur-md flex flex-col z-20 flex-shrink-0 transition-all duration-200 ease-in-out select-none shadow-xs ${
        isCollapsed ? "w-14" : "w-84"
      }`}
    >
      {/* Panel 顶部：圆 tab 切换区 (只放 icon，无文字) */}
      <div className="h-13 px-2.5 border-b border-slate-100 flex items-center justify-between gap-1 flex-shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = !isCollapsed && activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleTabClick(tab.id)}
                className={`size-8 rounded-full transition-all duration-150 relative ${
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

        {/* 展开/收起切换把手 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="size-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title={isCollapsed ? "展开右侧面板" : "收起面板"}
        >
          <ChevronRight
            className={`size-3.5 transition-transform duration-200 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {/* Panel 内部主体：折叠时隐藏内容，展开时渲染激活 tab */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === "design" && <DesignTokenPanel />}
          {activeTab === "sections" && (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center text-slate-400 text-xs">
              <Layers className="size-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="font-medium text-slate-600">模块结构视图</p>
              <p className="text-[11px] text-slate-400 mt-1">
                支持拖拽重排、显隐控制与跨栏调配
              </p>
            </div>
          )}
          {activeTab === "json" && isJsonEditorEnabled && <JsonEditorPanel />}
        </div>
      )}
    </aside>
  );
};
