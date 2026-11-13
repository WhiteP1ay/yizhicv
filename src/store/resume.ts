import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "@/lib/idb-storage";
import {
  defaultResume,
  type ResumeSection,
  type RightPanelTab,
  SECTION_PRESETS,
  type YizhiResume,
} from "@/types/resume";

interface ResumeState {
  resume: YizhiResume;
  activeSectionId: string | null;
  isPaddingHighlight: boolean; // 悬停调节边距时的临时高亮，不写入设置

  // Actions
  setActiveSectionId: (id: string | null) => void;
  toggleBlurMode: () => void;
  toggleJsonEditor: () => void;
  setJsonEditorEnabled: (enabled: boolean) => void;
  setIsPaddingHighlight: (highlight: boolean) => void;
  setPreviewScale: (scale: number) => void;
  setRightPanelWidth: (width: number) => void;
  setIsRightPanelCollapsed: (
    collapsed: boolean | ((prev: boolean) => boolean),
  ) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setCustomColorSlot: (index: number, color: string | null) => void;
  setConfigCardOpen: (id: string, open: boolean) => void;
  setTitle: (title: string) => void;

  // Layout & Design
  setSidebarWidth: (width: number) => void;
  setThemeColor: (color: string) => void;
  setFontFamily: (font: "sans" | "serif" | "mono") => void;
  setFontSize: (size: number) => void;
  setLineHeight: (lineHeight: number) => void;
  setSectionGap: (gap: number) => void;
  setPagePadding: (padding: number) => void;
  setCustomCss: (css: string) => void;
  resetDesign: () => void;

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
  addDefaultSection: (slot: "main" | "sidebar") => string;
  reorderSections: (newSections: ResumeSection[]) => void;
  resetResume: () => void;
  clearResume: () => void;
  importResume: (newResume: YizhiResume) => void;
  createNewResume: () => void;
}

let paddingHighlightTimer: ReturnType<typeof setTimeout> | null = null;

const createInitialResume = (): YizhiResume => ({
  ...defaultResume,
  metadata: {
    ...defaultResume.metadata,
    id: `cv_${nanoid(8)}`,
    title: "未命名",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
});

export const useResumeStore = create<ResumeState>()(
  temporal(
    persist(
      (set) => ({
        resume: defaultResume,
        activeSectionId: defaultResume.sections[0]?.id || null,
        isPaddingHighlight: false,

        setActiveSectionId: (id) => set({ activeSectionId: id }),
        toggleBlurMode: () =>
          set((state) => {
            const next = !state.resume.settings.isBlurMode;
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  isBlurMode: next,
                },
              },
            };
          }),
        toggleJsonEditor: () =>
          set((state) => {
            const next = !state.resume.settings.isJsonEditorEnabled;
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  isJsonEditorEnabled: next,
                },
              },
            };
          }),
        setJsonEditorEnabled: (enabled) =>
          set((state) => ({
            resume: {
              ...state.resume,
              settings: {
                ...state.resume.settings,
                isJsonEditorEnabled: enabled,
              },
            },
          })),
        setIsPaddingHighlight: (isPaddingHighlight) =>
          set({ isPaddingHighlight }),
        setPreviewScale: (scale) =>
          set((state) => {
            const clamped = Math.max(0.4, Math.min(1.4, scale));
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  previewScale: clamped,
                },
              },
            };
          }),
        setRightPanelWidth: (width) =>
          set((state) => {
            const clamped = Math.max(200, Math.min(1000, Math.round(width)));
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  rightPanelWidth: clamped,
                },
              },
            };
          }),
        setIsRightPanelCollapsed: (collapsed) =>
          set((state) => {
            const next =
              typeof collapsed === "function"
                ? collapsed(state.resume.settings.isRightPanelCollapsed)
                : collapsed;
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  isRightPanelCollapsed: next,
                },
              },
            };
          }),

        setRightPanelTab: (tab) =>
          set((state) => {
            if (state.resume.settings.rightPanelTab === tab) return state;
            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  rightPanelTab: tab,
                },
              },
            };
          }),

        setCustomColorSlot: (index, color) =>
          set((state) => {
            const currentSlots = [
              ...(state.resume.settings.customColors || [
                null,
                null,
                null,
                null,
                null,
              ]),
            ];
            while (currentSlots.length < 5) currentSlots.push(null);
            currentSlots[index] = color;
            const nextSlots = currentSlots.slice(0, 5);

            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  customColors: nextSlots,
                },
              },
            };
          }),

        setConfigCardOpen: (id, open) =>
          set((state) => ({
            resume: {
              ...state.resume,
              settings: {
                ...state.resume.settings,
                configCards: {
                  ...state.resume.settings.configCards,
                  [id]: open,
                },
              },
            },
          })),

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
                sidebarWidth: Math.max(0, Math.min(580, sidebarWidth)),
              },
              metadata: {
                ...state.resume.metadata,
                updatedAt: new Date().toISOString(),
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
              design: {
                ...state.resume.design,
                sectionGap: Math.max(0, sectionGap),
              },
            },
          })),

        setPagePadding: (pagePadding) => {
          if (paddingHighlightTimer) {
            clearTimeout(paddingHighlightTimer);
          }
          paddingHighlightTimer = setTimeout(() => {
            set({ isPaddingHighlight: false });
          }, 1200);

          set((state) => ({
            resume: {
              ...state.resume,
              design: {
                ...state.resume.design,
                pagePadding: Math.max(0, pagePadding),
              },
            },
            isPaddingHighlight: true,
          }));
        },

        setCustomCss: (customCss) =>
          set((state) => ({
            resume: {
              ...state.resume,
              design: { ...state.resume.design, customCss },
            },
          })),

        resetDesign: () =>
          set((state) => ({
            resume: {
              ...state.resume,
              design: { ...defaultResume.design },
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
            const newSections = state.resume.sections.filter(
              (s) => s.id !== id,
            );
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

        addDefaultSection: (slot) => {
          const newId = `sec_${nanoid(8)}`;
          const defaultContent = `
<div class="cv-section-block mb-4">
  <h2 class="mb-2">模块标题</h2>
  <p class="text-sm text-slate-700">点击此处输入正文内容...</p>
</div>
`.trim();
          const newSection: ResumeSection = {
            id: newId,
            slot,
            visible: true,
            content: defaultContent,
          };

          set((state) => ({
            resume: {
              ...state.resume,
              sections: [...state.resume.sections, newSection],
              metadata: {
                ...state.resume.metadata,
                updatedAt: new Date().toISOString(),
              },
            },
            activeSectionId: newId,
          }));

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

        clearResume: () =>
          set({
            resume: createInitialResume(),
            activeSectionId: defaultResume.sections[0]?.id || null,
          }),

        importResume: (newResume) =>
          set({
            resume: newResume,
            activeSectionId: newResume.sections[0]?.id || null,
          }),

        createNewResume: () =>
          set({
            resume: createInitialResume(),
            activeSectionId: defaultResume.sections[0]?.id || null,
          }),
      }),
      {
        name: "yizhicv_resume_v2",
        storage: createJSONStorage(() => idbStorage),
        partialize: (state) => ({
          resume: state.resume,
        }),
        merge: (persistedState: unknown, currentState: ResumeState) => {
          const persisted = (persistedState || {}) as {
            resume?: Partial<YizhiResume>;
          };
          const rawResume = persisted.resume || {};
          const rawSettings: Partial<YizhiResume["settings"]> =
            rawResume.settings || {};

          const mergedResume: YizhiResume = {
            ...currentState.resume,
            ...rawResume,
            layout: {
              sidebarWidth:
                rawResume.layout?.sidebarWidth ??
                currentState.resume.layout.sidebarWidth,
            },
            settings: {
              ...currentState.resume.settings,
              ...rawSettings,
            },
          };

          // 彻底剔除历史遗留的无用字段
          delete (mergedResume.layout as unknown as Record<string, unknown>)
            .sidebarPosition;
          delete (mergedResume.settings as unknown as Record<string, unknown>)
            .imageSlots;

          return {
            ...currentState,
            resume: mergedResume,
          };
        },
      },
    ),
    {
      limit: 50,
      partialize: (state) => ({
        resume: state.resume,
      }),
      equality: (pastState, currentState) => {
        const withoutCards = (resume?: YizhiResume) => {
          if (!resume) return resume;
          const {
            configCards: _configCards,
            rightPanelTab: _rightPanelTab,
            ...settings
          } = resume.settings;
          return { ...resume, settings };
        };
        return (
          JSON.stringify(withoutCards(pastState?.resume)) ===
          JSON.stringify(withoutCards(currentState?.resume))
        );
      },
    },
  ),
);
