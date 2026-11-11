"use client";

import type React from "react";
import { useCallback, useRef } from "react";
import { useResumeStore } from "@/store/resume";
import { getResumeExportName, yizhiResumeSchema } from "@/types/resume";

interface UseResumeFileActionsOptions {
  onActionComplete?: () => void;
}

/**
 * 简历文档生命周期与文件流管理 Hook
 *
 * 核心功能：
 * 1. 新建简历：二次确认确认防误触，清空画布重建标准文档；
 * 2. 导入 JSON：读取本地文件，执行 zod 规范校验，兼顾向后兼容修复；
 * 3. 导出 PDF：调用 window.print() 原生打印管线，结合 @media print 渲染纯净矢量 A4；
 * 4. 导出 JSON：序列化文档结构，利用 Blob 与动态链接下载标准 .json 文件。
 */
export function useResumeFileActions(
  options: UseResumeFileActionsOptions = {},
) {
  const { onActionComplete } = options;
  const { resume, createNewResume, importResume } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 新建简历
  const handleNew = useCallback(() => {
    onActionComplete?.();
    if (window.confirm("确定要新建一份简历吗？当前未导出的修改将被覆盖。")) {
      createNewResume();
    }
  }, [createNewResume, onActionComplete]);

  // 2. 触发导入文件选择器
  const triggerImport = useCallback(() => {
    onActionComplete?.();
    fileInputRef.current?.click();
  }, [onActionComplete]);

  // 3. 处理 JSON 文件导入与格式兼容
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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
            // 尝试宽松兼容历史或第三方结构
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
    },
    [resume, importResume],
  );

  // 4. 导出 PDF
  const exportPdf = useCallback(() => {
    onActionComplete?.();
    window.print();
  }, [onActionComplete]);

  // 5. 导出 JSON
  const exportJson = useCallback(() => {
    onActionComplete?.();
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
  }, [resume, onActionComplete]);

  return {
    fileInputRef,
    handleNew,
    triggerImport,
    handleFileChange,
    exportPdf,
    exportJson,
  };
}
