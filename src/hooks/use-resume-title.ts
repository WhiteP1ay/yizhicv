"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useResumeStore } from "@/store/resume";

/**
 * 简历标题编辑、草稿与状态同步 Hook
 *
 * 核心特性：
 * 1. 响应式草稿：进入编辑态时从 store 预填充，取消时自动回退；
 * 2. 外部变更同步：外部导入简历或更换文档时，非编辑状态下自动同步最新标题；
 * 3. 提交与校验：去除首尾空格，若为空白则保底为"未命名"；
 * 4. 键盘手势集成：Enter 确认保存，Escape 取消编辑。
 */
export function useResumeTitle() {
  const { resume, setTitle } = useResumeStore();
  const currentTitle = resume.metadata.title || "未命名";

  const [isEditing, setIsEditing] = useState(false);
  const [titleInput, setTitleInput] = useState(currentTitle);

  // 外部导入或变更简历时同步当前草稿
  useEffect(() => {
    if (!isEditing) {
      setTitleInput(currentTitle);
    }
  }, [currentTitle, isEditing]);

  // 开始编辑
  const startEditing = useCallback(() => {
    setTitleInput(currentTitle);
    setIsEditing(true);
  }, [currentTitle]);

  // 取消编辑
  const cancelEditing = useCallback(() => {
    setTitleInput(currentTitle);
    setIsEditing(false);
  }, [currentTitle]);

  // 提交重命名
  const submitTitle = useCallback(() => {
    const trimmed = titleInput.trim();
    const finalTitle = trimmed || "未命名";
    setTitle(finalTitle);
    setTitleInput(finalTitle);
    setIsEditing(false);
  }, [titleInput, setTitle]);

  // 键盘快捷响应
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submitTitle();
      } else if (e.key === "Escape") {
        cancelEditing();
      }
    },
    [submitTitle, cancelEditing],
  );

  return {
    title: currentTitle,
    titleInput,
    isEditing,
    setTitleInput,
    startEditing,
    cancelEditing,
    submitTitle,
    handleKeyDown,
  };
}
