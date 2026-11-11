"use client";

import type { Editor } from "@tiptap/react";
import { create } from "zustand";

interface ActiveEditorState {
  editor: Editor | null;
  activeSectionId: string | null;
  selectionTick: number;
  editors: Record<string, Editor>;
  setActiveEditor: (editor: Editor | null, sectionId?: string | null) => void;
  registerEditor: (id: string, editor: Editor) => void;
  unregisterEditor: (id: string) => void;
  notifySelectionUpdate: () => void;
  getEffectiveEditor: () => Editor | null;
}

export const useActiveEditorStore = create<ActiveEditorState>((set, get) => ({
  editor: null,
  activeSectionId: null,
  selectionTick: 0,
  editors: {},
  setActiveEditor: (editor, sectionId = null) =>
    set({ editor, activeSectionId: sectionId }),
  registerEditor: (id, editor) =>
    set((state) => ({
      editors: { ...state.editors, [id]: editor },
      // 如果当前没有 active editor，默认把第一个注册的设为 active
      editor: state.editor ?? editor,
      activeSectionId: state.activeSectionId ?? id,
    })),
  unregisterEditor: (id) =>
    set((state) => {
      const nextEditors = { ...state.editors };
      delete nextEditors[id];
      const nextEditor =
        state.editor === state.editors[id]
          ? Object.values(nextEditors)[0] || null
          : state.editor;
      return {
        editors: nextEditors,
        editor: nextEditor,
        activeSectionId:
          state.activeSectionId === id
            ? Object.keys(nextEditors)[0] || null
            : state.activeSectionId,
      };
    }),
  notifySelectionUpdate: () =>
    set((state) => ({ selectionTick: state.selectionTick + 1 })),
  getEffectiveEditor: () => {
    const { editor, activeSectionId, editors } = get();
    if (editor && !editor.isDestroyed) return editor;
    if (
      activeSectionId &&
      editors[activeSectionId] &&
      !editors[activeSectionId].isDestroyed
    ) {
      return editors[activeSectionId];
    }
    const available = Object.values(editors).find((ed) => !ed.isDestroyed);
    return available ?? null;
  },
}));
