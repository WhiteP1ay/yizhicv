"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror, { keymap } from "@uiw/react-codemirror";
import { Check, Copy, RefreshCw, Wand2 } from "lucide-react";
import { nanoid } from "nanoid";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResumeStore } from "@/store/resume";
import { defaultResume, type YizhiResume } from "@/types/resume";

export const JsonEditorPanel: React.FC = () => {
  const { resume, importResume } = useResumeStore();

  const [code, setCode] = useState(() => JSON.stringify(resume, null, 2));
  const [lastSyncedJson, setLastSyncedJson] = useState(() =>
    JSON.stringify(resume, null, 2),
  );
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  const syncFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // 当外部 store 变更时（且本地无未同步的编辑），自动同步到编辑器中
  useEffect(() => {
    if (!hasUnsyncedChanges) {
      try {
        const currentInStore = JSON.stringify(resume, null, 2);
        setCode(currentInStore);
        setLastSyncedJson(currentInStore);
        setError(null);
      } catch {
        // ignore
      }
    }
  }, [resume, hasUnsyncedChanges]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      if (syncFeedbackTimerRef.current) {
        clearTimeout(syncFeedbackTimerRef.current);
      }
    };
  }, []);

  // 执行核心同步：将当前 JSON 应用到 Zustand Store 画布
  const handleSync = useCallback(() => {
    try {
      const parsed = JSON.parse(code) as Partial<YizhiResume>;

      // 1. 根节点有效性校验
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setError("JSON 根节点必须是一个有效的配置对象");
        return;
      }

      // 2. 校验 sections 数组
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        setError("缺少必要的 sections 数组配置");
        return;
      }

      // 3. 校验 metadata 配置
      if (!parsed.metadata || typeof parsed.metadata !== "object") {
        setError("缺少必要的 metadata 描述信息");
        return;
      }

      // 4. 组装具备完备保底的 YizhiResume 对象，确保系统鲁棒性（严格使用 settings 与 isRightPanelCollapsed）
      const rawSettings = (parsed.settings || {}) as Partial<
        YizhiResume["settings"]
      >;

      const fullResume: YizhiResume = {
        version: "2.0.0",
        ...parsed,
        metadata: {
          ...parsed.metadata,
          id: parsed.metadata.id || `cv_${nanoid(8)}`,
          title: parsed.metadata.title || "未命名",
          createdAt: parsed.metadata.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          language: parsed.metadata.language || "zh",
        },
        layout: {
          sidebarWidth:
            typeof parsed.layout?.sidebarWidth === "number"
              ? parsed.layout.sidebarWidth
              : defaultResume.layout.sidebarWidth,
        },
        settings: {
          ...defaultResume.settings,
          ...rawSettings,
          rightPanelWidth:
            typeof rawSettings.rightPanelWidth === "number"
              ? rawSettings.rightPanelWidth
              : defaultResume.settings.rightPanelWidth,
          isRightPanelCollapsed:
            typeof rawSettings.isRightPanelCollapsed === "boolean"
              ? rawSettings.isRightPanelCollapsed
              : defaultResume.settings.isRightPanelCollapsed,
          previewScale:
            typeof rawSettings.previewScale === "number"
              ? rawSettings.previewScale
              : defaultResume.settings.previewScale,
          isBlurMode:
            typeof rawSettings.isBlurMode === "boolean"
              ? rawSettings.isBlurMode
              : defaultResume.settings.isBlurMode,
          isJsonEditorEnabled:
            typeof rawSettings.isJsonEditorEnabled === "boolean"
              ? rawSettings.isJsonEditorEnabled
              : defaultResume.settings.isJsonEditorEnabled,
          customColors: Array.isArray(rawSettings.customColors)
            ? rawSettings.customColors.slice(0, 5)
            : defaultResume.settings.customColors,
        },
        design: {
          ...defaultResume.design,
          ...parsed.design,
        },
        sections: parsed.sections.map((s) => ({
          id: s.id || `sec_${nanoid(6)}`,
          slot: s.slot === "sidebar" ? "sidebar" : "main",
          visible: s.visible !== false,
          content: typeof s.content === "string" ? s.content : "",
        })),
      };

      // 彻底清理无用冗余字段
      delete (fullResume.layout as unknown as Record<string, unknown>)
        .sidebarPosition;

      // 同步提交到 Zustand 状态机
      importResume(fullResume);

      // 格式化当前展示代码并刷新同步基准
      const formatted = JSON.stringify(fullResume, null, 2);
      setCode(formatted);
      setLastSyncedJson(formatted);
      setHasUnsyncedChanges(false);
      setError(null);

      // 触发同步成功视觉反馈
      setJustSynced(true);
      if (syncFeedbackTimerRef.current) {
        clearTimeout(syncFeedbackTimerRef.current);
      }
      syncFeedbackTimerRef.current = setTimeout(() => {
        setJustSynced(false);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("JSON 语法解析失败，请检查逗号、引号或闭合括号");
      }
    }
  }, [code, importResume]);

  const handleSyncRef = useRef(handleSync);
  handleSyncRef.current = handleSync;

  // 编辑器打字变更回调（绝不自动触发 importResume）
  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      if (value === lastSyncedJson) {
        setHasUnsyncedChanges(false);
      } else {
        setHasUnsyncedChanges(true);
      }

      // 若此前有语法报错，用户修复语法后打字时自动清除报错
      if (error) {
        try {
          JSON.parse(value);
          setError(null);
        } catch {
          // 语法尚未闭合，保留当前提示
        }
      }
    },
    [lastSyncedJson, error],
  );

  // 格式化当前 JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      setCode(formatted);
      if (formatted === lastSyncedJson) {
        setHasUnsyncedChanges(false);
      } else {
        setHasUnsyncedChanges(true);
      }
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`格式化失败: ${err.message}`);
      }
    }
  };

  // 一键复制
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // 从当前画布数据强制重置覆盖（放弃本地未同步修改）
  const handleResetFromStore = () => {
    const currentInStore = JSON.stringify(resume, null, 2);
    setCode(currentInStore);
    setLastSyncedJson(currentInStore);
    setHasUnsyncedChanges(false);
    setError(null);
  };

  // 快捷键扩展：支持 ⌘S / Ctrl+S 快速同步到画布
  const keymapExtension = useMemo(
    () =>
      keymap.of([
        {
          key: "Mod-s",
          run: () => {
            handleSyncRef.current();
            return true;
          },
        },
      ]),
    [],
  );

  return (
    <div
      className="flex-1 flex flex-col h-full min-h-0 bg-white overflow-hidden select-none"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
          e.preventDefault();
          handleSync();
        }
      }}
    >
      {/* 顶部操作条 */}
      <div className="h-9 px-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-shrink-0 text-xs">
        {/* 左侧：标签与状态指示 */}
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="text-[11px] font-mono font-semibold text-slate-500">
            JSON
          </span>
          {error ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-600 rounded border border-rose-200">
              <span className="size-1 rounded-full bg-rose-500 animate-pulse" />
              语法异常
            </span>
          ) : hasUnsyncedChanges ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 rounded border border-amber-200">
              <span className="size-1 rounded-full bg-amber-500" />
              待同步
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
              <span className="size-1 rounded-full bg-emerald-500" />
              已同步
            </span>
          )}
        </div>

        {/* 右侧：工具按钮与核心同步按钮 */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleFormat}
            className="size-6 text-slate-500 hover:text-slate-900"
            title="美化排版 JSON"
          >
            <Wand2 className="size-3" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCopy}
            className="size-6 text-slate-500 hover:text-slate-900"
            title="复制到剪贴板"
          >
            {copied ? (
              <Check className="size-3 text-emerald-600 stroke-[2.5]" />
            ) : (
              <Copy className="size-3" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleResetFromStore}
            className="size-6 text-slate-500 hover:text-slate-900"
            title="从画布重新拉取最新数据 (放弃未同步编辑)"
          >
            <RefreshCw className="size-3" />
          </Button>

          <Separator
            orientation="vertical"
            className="h-3 mx-0.5 bg-slate-200"
          />

          {/* 核心同步按钮 */}
          <Button
            type="button"
            variant={hasUnsyncedChanges ? "default" : "outline"}
            size="xs"
            onClick={handleSync}
            disabled={!hasUnsyncedChanges && !justSynced}
            className={`h-6 px-2.5 text-[11px] font-medium transition-all ${
              justSynced
                ? "bg-emerald-600 hover:bg-emerald-600 text-white border-transparent"
                : hasUnsyncedChanges
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs border-transparent active:scale-95"
                  : "bg-slate-50 text-slate-400 border-slate-200 cursor-default hover:bg-slate-50 hover:text-slate-400 opacity-60"
            }`}
            title={
              hasUnsyncedChanges
                ? "将 JSON 修改同步应用至简历 (⌘S)"
                : "当前编辑器内容已与简历完全一致"
            }
          >
            {justSynced ? "已同步到简历" : "同步到简历"}
          </Button>
        </div>
      </div>

      {/* CodeMirror 编辑器主体 */}
      <div className="flex-1 min-h-0 overflow-auto text-xs font-mono">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[json(), keymapExtension]}
          onChange={handleChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            searchKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full text-xs"
        />
      </div>

      {/* 底部报错栏 */}
      {error && (
        <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] font-mono flex items-center justify-between flex-shrink-0">
          <span className="truncate" title={error}>
            ⚠️ {error}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setError(null)}
            className="size-4 p-0 text-rose-400 hover:text-rose-700 flex-shrink-0"
            title="关闭报错"
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
};
