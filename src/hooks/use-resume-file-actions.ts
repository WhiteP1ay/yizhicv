"use client";

import { useRouter } from "next/navigation";
import type React from "react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { parseResumeDocument } from "@/lib/resume-document";
import { createResume } from "@/lib/resume-library";
import { confirmDialog } from "@/store/confirm-dialog";
import { useResumeStore } from "@/store/resume";
import { getResumeExportName, yizhiResumeSchema } from "@/types/resume";

interface UseResumeFileActionsOptions {
  onActionComplete?: () => void;
}

/**
 * 简历文档生命周期与文件流管理 Hook
 *
 * 核心功能：
 * 1. 新建简历：另建一份并打开，原来的简历留在列表里；
 * 2. 清空数据：二次确认后清空当前这份简历的内容，不删除其他简历；
 * 3. 导入 JSON：读取本地文件，执行 zod 规范校验，兼顾向后兼容修复；
 * 4. 导出 PDF：调用 window.print() 原生打印管线，结合 @media print 渲染纯净矢量 A4；
 * 5. 导出 JSON：序列化文档结构，利用 Blob 与动态链接下载标准 .json 文件。
 */
export function useResumeFileActions(
  options: UseResumeFileActionsOptions = {},
) {
  const { onActionComplete } = options;
  const router = useRouter();
  const { status, user } = useCurrentUser();
  const { resume, clearResume, importResume } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = useCallback(() => {
    onActionComplete?.();
    if (status !== "ready") return;
    void (async () => {
      const next = await createResume(Boolean(user));
      router.push(`/app/${next.metadata.id}`);
    })();
  }, [onActionComplete, router, status, user]);

  const handleClear = useCallback(() => {
    onActionComplete?.();
    void (async () => {
      const ok = await confirmDialog({
        title: "清空内容",
        description: "这份简历的内容会被清空，此操作不可撤销。",
        confirmLabel: "清空",
        destructive: true,
      });
      if (!ok) return;
      clearResume();
    })();
  }, [clearResume, onActionComplete]);

  // 3. 触发导入文件选择器
  const triggerImport = useCallback(() => {
    onActionComplete?.();
    fileInputRef.current?.click();
  }, [onActionComplete]);

  // 4. 处理 JSON 文件导入与格式兼容
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
            const imported = parseResumeDocument({
              ...parsed.data,
              metadata: {
                ...parsed.data.metadata,
                id: resume.metadata.id,
                createdAt: resume.metadata.createdAt,
                updatedAt: new Date().toISOString(),
              },
            });
            if (!imported) {
              toast.error("导入失败：文件格式不符合一纸简历规范");
              return;
            }
            importResume(imported);
            toast.success("简历导入成功");
          } else {
            // 尝试宽松兼容历史或第三方结构
            if (raw && Array.isArray(raw.sections)) {
              const normalized = {
                ...resume,
                ...raw,
                metadata: {
                  ...resume.metadata,
                  ...(raw.metadata || {}),
                  id: resume.metadata.id,
                  createdAt: resume.metadata.createdAt,
                  updatedAt: new Date().toISOString(),
                },
              };
              const compatible = parseResumeDocument(normalized);
              if (!compatible) {
                toast.error("导入失败：文件格式不符合一纸简历规范");
                return;
              }
              importResume(compatible);
              toast.success("简历已兼容导入");
            } else {
              toast.error("导入失败：文件格式不符合一纸简历规范");
            }
          }
        } catch {
          toast.error("导入失败：无效的 JSON 文件");
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
    handleClear,
    triggerImport,
    handleFileChange,
    exportPdf,
    exportJson,
  };
}
