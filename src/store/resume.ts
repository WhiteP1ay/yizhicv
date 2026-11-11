import { nanoid } from "nanoid";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  defaultResume,
  type ResumeSection,
  SECTION_PRESETS,
  type YizhiResume,
} from "@/types/resume";

interface ResumeState {
  resume: YizhiResume;
  activeSectionId: string | null;
  isBlurMode: boolean; // 是否开启全局脱敏预览（模糊遮盖）
  previewScale: number; // 画布缩放比例 (0.5 ~ 1.3)

  // Actions
  setActiveSectionId: (id: string | null) => void;
  toggleBlurMode: () => void;
  setPreviewScale: (scale: number) => void;
  setTitle: (title: string) => void;

  // Layout & Design
  setSidebarWidth: (width: number) => void;
  setSidebarPosition: (position: "left" | "right") => void;
  setThemeColor: (color: string) => void;
  setFontFamily: (font: "sans" | "serif" | "mono") => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setSectionGap: (gap: number) => void;
  setPagePadding: (padding: number) => void;
  setCustomCss: (css: string) => void;

  // Sections
  updateSectionContent: (id: string, content: string) => void;
  setSectionSlot: (id: string, slot: "main" | "sidebar") => void;
  toggleSectionVisible: (id: string) => void;
  removeSection: (id: string) => void;
  moveSectionUp: (id: string) => void;
  moveSectionDown: (id: string) => void;
  addSectionFromPreset: (
    presetKey: string,
    slot?: "main" | "sidebar",
    insertAfterId?: string,
  ) => string;
  reorderSections: (newSections: ResumeSection[]) => void;
  resetResume: () => void;
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set) => ({
      resume: defaultResume,
      activeSectionId: defaultResume.sections[0]?.id || null,
      isBlurMode: false,
      previewScale: 0.88,

      setActiveSectionId: (id) => set({ activeSectionId: id }),
      toggleBlurMode: () => set((state) => ({ isBlurMode: !state.isBlurMode })),
      setPreviewScale: (scale) =>
        set({ previewScale: Math.max(0.4, Math.min(1.4, scale)) }),

      setTitle: (title) =>
        set((state) => ({
          resume: {
            ...state.resume,
            metadata: {
              ...state.resume.metadata,
              title,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      setSidebarWidth: (sidebarWidth) =>
        set((state) => ({
          resume: {
            ...state.resume,
            layout: {
              ...state.resume.layout,
              sidebarWidth: Math.max(0, Math.min(400, sidebarWidth)),
            },
            metadata: {
              ...state.resume.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      setSidebarPosition: (sidebarPosition) =>
        set((state) => ({
          resume: {
            ...state.resume,
            layout: {
              ...state.resume.layout,
              sidebarPosition,
            },
          },
        })),

      setThemeColor: (themeColor) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, themeColor },
          },
        })),

      setFontFamily: (fontFamily) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, fontFamily },
          },
        })),

      setFontSize: (fontSize) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, fontSize },
          },
        })),

      setLineHeight: (lineHeight) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, lineHeight },
          },
        })),

      setSectionGap: (sectionGap) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, sectionGap },
          },
        })),

      setPagePadding: (pagePadding) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, pagePadding },
          },
        })),

      setCustomCss: (customCss) =>
        set((state) => ({
          resume: {
            ...state.resume,
            design: { ...state.resume.design, customCss },
          },
        })),

      updateSectionContent: (id, content) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === id ? { ...section, content } : section,
            ),
            metadata: {
              ...state.resume.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      setSectionSlot: (id, slot) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === id ? { ...section, slot } : section,
            ),
          },
        })),

      toggleSectionVisible: (id) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: state.resume.sections.map((section) =>
              section.id === id
                ? { ...section, visible: !section.visible }
                : section,
            ),
          },
        })),

      removeSection: (id) =>
        set((state) => {
          const newSections = state.resume.sections.filter((s) => s.id !== id);
          return {
            resume: {
              ...state.resume,
              sections: newSections,
              metadata: {
                ...state.resume.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            activeSectionId:
              state.activeSectionId === id
                ? newSections[0]?.id || null
                : state.activeSectionId,
          };
        }),

      moveSectionUp: (id) =>
        set((state) => {
          const idx = state.resume.sections.findIndex((s) => s.id === id);
          if (idx <= 0) return state;
          const currentSlot = state.resume.sections[idx].slot;
          // 找到当前 slot 内的上一个同类元素并交换
          let prevIdx = -1;
          for (let i = idx - 1; i >= 0; i--) {
            if (state.resume.sections[i].slot === currentSlot) {
              prevIdx = i;
              break;
            }
          }
          if (prevIdx === -1) return state;

          const updated = [...state.resume.sections];
          const temp = updated[idx];
          updated[idx] = updated[prevIdx];
          updated[prevIdx] = temp;

          return {
            resume: {
              ...state.resume,
              sections: updated,
            },
          };
        }),

      moveSectionDown: (id) =>
        set((state) => {
          const idx = state.resume.sections.findIndex((s) => s.id === id);
          if (idx === -1 || idx >= state.resume.sections.length - 1)
            return state;
          const currentSlot = state.resume.sections[idx].slot;
          // 找到当前 slot 内的下一个同类元素并交换
          let nextIdx = -1;
          for (let i = idx + 1; i < state.resume.sections.length; i++) {
            if (state.resume.sections[i].slot === currentSlot) {
              nextIdx = i;
              break;
            }
          }
          if (nextIdx === -1) return state;

          const updated = [...state.resume.sections];
          const temp = updated[idx];
          updated[idx] = updated[nextIdx];
          updated[nextIdx] = temp;

          return {
            resume: {
              ...state.resume,
              sections: updated,
            },
          };
        }),

      addSectionFromPreset: (presetKey, slotOverride, insertAfterId) => {
        const preset = SECTION_PRESETS[presetKey] || SECTION_PRESETS.custom;
        const newId = `sec_${nanoid(8)}`;
        const newSection: ResumeSection = {
          id: newId,
          slot: slotOverride || preset.defaultSlot,
          visible: true,
          content: preset.initialContent,
        };

        set((state) => {
          const sections = [...state.resume.sections];
          if (insertAfterId) {
            const idx = sections.findIndex((s) => s.id === insertAfterId);
            if (idx !== -1) {
              sections.splice(idx + 1, 0, newSection);
            } else {
              sections.push(newSection);
            }
          } else {
            sections.push(newSection);
          }

          return {
            resume: {
              ...state.resume,
              sections,
              metadata: {
                ...state.resume.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            activeSectionId: newId,
          };
        });

        return newId;
      },

      reorderSections: (newSections) =>
        set((state) => ({
          resume: {
            ...state.resume,
            sections: newSections,
            metadata: {
              ...state.resume.metadata,
              updatedAt: new Date().toISOString(),
            },
          },
        })),

      resetResume: () =>
        set({
          resume: defaultResume,
          activeSectionId: defaultResume.sections[0]?.id || null,
        }),
    }),
    {
      name: "yizhicv_resume_v2",
      partialize: (state) => ({ resume: state.resume }),
    },
  ),
);
