"use client";

import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";
import { Check, Copy, RefreshCw, Wand2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resume";
import type { YizhiResume } from "@/types/resume";

export const JsonEditorPanel: React.FC = () => {
  const { resume, importResume } = useResumeStore();

  const [code, setCode] = useState(() => JSON.stringify(resume, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isInternalEdit, setIsInternalEdit] = useState(false);

  // 当外部 store 变更时（且非本地打字中），同步到本地编辑器
  useEffect(() => {
    if (!isInternalEdit) {
      try {
        const currentInStore = JSON.stringify(resume, null, 2);
        setCode(currentInStore);
        setError(null);
      } catch {
        // ignore
      }
    }
  }, [resume, isInternalEdit]);

  // 编辑器变更回调
  const handleChange = useCallback(
    (value: string) => {
      setCode(value);
      setIsInternalEdit(true);

      try {
        const parsed = JSON.parse(value) as YizhiResume;
        // 基本合法性校验：必须具备 metadata 和 sections 数组
        if (
          parsed &&
          typeof parsed === "object" &&
          Array.isArray(parsed.sections) &&
          parsed.metadata
        ) {
          setError(null);
          importResume(parsed);
        } else {
          setError("缺少 sections 或 metadata 必要字段");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("JSON 语法解析失败");
        }
      }

      // 600ms 后恢复外部同步状态
      const timer = setTimeout(() => {
        setIsInternalEdit(false);
      }, 600);
      return () => clearTimeout(timer);
    },
    [importResume],
  );

  // 格式化当前 JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(code);
      const formatted = JSON.stringify(parsed, null, 2);
      setCode(formatted);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
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

  // 从当前画布数据强制重置覆盖
  const handleResetFromStore = () => {
    setCode(JSON.stringify(resume, null, 2));
    setError(null);
    setIsInternalEdit(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white overflow-hidden select-none">
      {/* 顶部操作条 */}
      <div className="h-9 px-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between flex-shrink-0 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <span className="text-[11px] font-mono text-slate-500">JSON</span>
          {error ? (
            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-rose-50 text-rose-600 rounded border border-rose-200">
              语法异常
            </span>
          ) : (
            <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-emerald-50 text-emerald-600 rounded border border-emerald-200">
              双向同步中
            </span>
          )}
        </div>

        {/* 工具按钮群 (严禁野生 button) */}
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
            title="重新拉取画布数据"
          >
            <RefreshCw className="size-3" />
          </Button>
        </div>
      </div>

      {/* CodeMirror 编辑器主体 */}
      <div className="flex-1 min-h-0 overflow-auto text-xs font-mono">
        <CodeMirror
          value={code}
          height="100%"
          extensions={[json()]}
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

      {/* 底部报错栏（若存在语法解析错误） */}
      {error && (
        <div className="px-3 py-1.5 bg-rose-50 border-t border-rose-200 text-rose-700 text-[11px] font-mono truncate flex-shrink-0">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};
