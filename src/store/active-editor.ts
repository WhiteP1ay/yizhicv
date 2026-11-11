"use client";

import type { Editor } from "@tiptap/react";
import { create } from "zustand";

interface ActiveEditorState {
  editor: Editor | null;
  activeSectionId: string | null;
  selectionTick: number;
  setActiveEditor: (editor: Editor | null, sectionId?: string | null) => void;
  notifySelectionUpdate: () => void;
}

export const useActiveEditorStore = create<ActiveEditorState>((set) => ({
  editor: null,
  activeSectionId: null,
  selectionTick: 0,
  setActiveEditor: (editor, sectionId = null) =>
    set({ editor, activeSectionId: sectionId }),
  notifySelectionUpdate: () =>
    set((state) => ({ selectionTick: state.selectionTick + 1 })),
}));
