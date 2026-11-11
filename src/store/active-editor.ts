import type { Editor } from "@tiptap/react";
import { create } from "zustand";

export interface HeadingState {
  isH1: boolean;
  isH2: boolean;
  isH3: boolean;
  isParagraph: boolean;
}

interface ActiveEditorState {
  activeEditor: Editor | null;
  activeSectionId: string | null;
  headingState: HeadingState;
  editors: Map<string, Editor>;

  // Actions
  setActiveEditor: (editor: Editor | null, sectionId?: string | null) => void;
  registerEditor: (sectionId: string, editor: Editor) => void;
  unregisterEditor: (sectionId: string) => void;
  syncHeadingState: (editor?: Editor | null) => void;
  toggleHeading: (level: 1 | 2 | 3) => void;
  setParagraph: () => void;
  getTargetEditor: () => Editor | null;
}

const defaultHeadingState: HeadingState = {
  isH1: false,
  isH2: false,
  isH3: false,
  isParagraph: true,
};

export const useActiveEditorStore = create<ActiveEditorState>((set, get) => ({
  activeEditor: null,
  activeSectionId: null,
  headingState: defaultHeadingState,
  editors: new Map<string, Editor>(),

  getTargetEditor: () => {
    const { activeEditor, activeSectionId, editors } = get();
    if (activeEditor && !activeEditor.isDestroyed) {
      return activeEditor;
    }
    if (activeSectionId && editors.has(activeSectionId)) {
      const editor = editors.get(activeSectionId);
      if (editor && !editor.isDestroyed) return editor;
    }
    // Fallback 到第一个可用的编辑器
    for (const editor of editors.values()) {
      if (editor && !editor.isDestroyed) return editor;
    }
    return null;
  },

  setActiveEditor: (editor, sectionId = null) => {
    set({
      activeEditor: editor,
      ...(sectionId ? { activeSectionId: sectionId } : {}),
    });
    if (editor) {
      get().syncHeadingState(editor);
    }
  },

  registerEditor: (sectionId, editor) => {
    const { editors, activeEditor } = get();
    editors.set(sectionId, editor);
    // 若当前没有活跃编辑器，或已销毁，自动绑定当前编辑器
    if (!activeEditor || activeEditor.isDestroyed) {
      set({
        activeEditor: editor,
        activeSectionId: sectionId,
      });
      get().syncHeadingState(editor);
    }
  },

  unregisterEditor: (sectionId) => {
    const { editors, activeEditor, activeSectionId } = get();
    editors.delete(sectionId);
    if (activeSectionId === sectionId || activeEditor?.isDestroyed) {
      const fallbackEntry = editors.entries().next().value;
      set({
        activeEditor: fallbackEntry ? fallbackEntry[1] : null,
        activeSectionId: fallbackEntry ? fallbackEntry[0] : null,
      });
    }
  },

  syncHeadingState: (editor) => {
    const target = editor || get().getTargetEditor();
    if (!target || target.isDestroyed) return;

    const isH1 = target.isActive("heading", { level: 1 });
    const isH2 = target.isActive("heading", { level: 2 });
    const isH3 = target.isActive("heading", { level: 3 });
    const isParagraph =
      target.isActive("paragraph") || (!isH1 && !isH2 && !isH3);

    const prev = get().headingState;
    if (
      prev.isH1 !== isH1 ||
      prev.isH2 !== isH2 ||
      prev.isH3 !== isH3 ||
      prev.isParagraph !== isParagraph
    ) {
      set({
        headingState: { isH1, isH2, isH3, isParagraph },
      });
    }
  },

  toggleHeading: (level: 1 | 2 | 3) => {
    const editor = get().getTargetEditor();
    if (!editor) return;

    editor.chain().focus().toggleHeading({ level }).run();
    get().syncHeadingState(editor);
  },

  setParagraph: () => {
    const editor = get().getTargetEditor();
    if (!editor) return;

    editor.chain().focus().setParagraph().run();
    get().syncHeadingState(editor);
  },
}));
