import { nanoid } from "nanoid";
import { temporal } from "zundo";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "@/lib/idb-storage";
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
  isPaddingHighlight: boolean; // 是否高亮显示页面边距辅助参考框
  isJsonEditorEnabled: boolean; // 是否在右侧面板开启 JSON 源码编辑 Tab
  previewScale: number; // 画布缩放比例 (0.5 ~ 1.3)
  rightPanelWidth: number; // 右侧面板展开宽度 (px)
  isRightPanelCollapsed: boolean; // 右侧面板是否折叠

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
  setCustomTextColorSlot: (index: number, color: string | null) => void;
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
  importResume: (newResume: YizhiResume) => void;
  createNewResume: () => void;
}

let paddingHighlightTimer: ReturnType<typeof setTimeout> | null = null;

export const useResumeStore = create<ResumeState>()(
  temporal(
    persist(
      (set) => ({
        resume: defaultResume,
        activeSectionId: defaultResume.sections[0]?.id || null,
        isBlurMode: defaultResume.settings.isBlurMode,
        isPaddingHighlight: false,
        isJsonEditorEnabled: defaultResume.settings.isJsonEditorEnabled,
        previewScale: defaultResume.settings.previewScale,
        rightPanelWidth: defaultResume.settings.rightPanelWidth,
        isRightPanelCollapsed: defaultResume.settings.isRightPanelCollapsed,

        setActiveSectionId: (id) => set({ activeSectionId: id }),
        toggleBlurMode: () =>
          set((state) => {
            const next = !state.isBlurMode;
            return {
              isBlurMode: next,
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
            const next = !state.isJsonEditorEnabled;
            return {
              isJsonEditorEnabled: next,
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
            isJsonEditorEnabled: enabled,
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
              previewScale: clamped,
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
              rightPanelWidth: clamped,
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
                ? collapsed(state.isRightPanelCollapsed)
                : collapsed;
            return {
              isRightPanelCollapsed: next,
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  isRightPanelCollapsed: next,
                },
              },
            };
          }),

        setCustomTextColorSlot: (index, color) =>
          set((state) => {
            const currentSlots = [
              ...(state.resume.settings.customTextColors || [
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

            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(
                  "yizhicv_custom_text_colors",
                  JSON.stringify(nextSlots),
                );
              } catch {
                // ignore local storage errors
              }
            }

            return {
              resume: {
                ...state.resume,
                settings: {
                  ...state.resume.settings,
                  customTextColors: nextSlots,
                },
              },
            };
          }),

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
            rightPanelWidth: defaultResume.settings.rightPanelWidth,
            isRightPanelCollapsed: defaultResume.settings.isRightPanelCollapsed,
            isBlurMode: defaultResume.settings.isBlurMode,
            isJsonEditorEnabled: defaultResume.settings.isJsonEditorEnabled,
            previewScale: defaultResume.settings.previewScale,
          }),

        importResume: (newResume) =>
          set({
            resume: newResume,
            activeSectionId: newResume.sections[0]?.id || null,
            rightPanelWidth: newResume.settings.rightPanelWidth,
            isRightPanelCollapsed: newResume.settings.isRightPanelCollapsed,
            isBlurMode: newResume.settings.isBlurMode,
            isJsonEditorEnabled: newResume.settings.isJsonEditorEnabled,
            previewScale: newResume.settings.previewScale,
          }),

        createNewResume: () =>
          set((state) => ({
            resume: {
              ...defaultResume,
              metadata: {
                ...defaultResume.metadata,
                id: `cv_${nanoid(8)}`,
                title: "未命名",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              settings: {
                ...state.resume.settings,
              },
            },
            activeSectionId: defaultResume.sections[0]?.id || null,
          })),
      }),
      {
        name: "yizhicv_resume_v2",
        storage: createJSONStorage(() => idbStorage),
        partialize: (state) => ({
          resume: state.resume,
          isJsonEditorEnabled: state.isJsonEditorEnabled,
        }),
        merge: (persistedState: unknown, currentState: ResumeState) => {
          const persisted = (persistedState || {}) as {
            resume?: Partial<YizhiResume>;
            isJsonEditorEnabled?: boolean;
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
              isJsonEditorEnabled:
                persisted.isJsonEditorEnabled ??
                rawSettings.isJsonEditorEnabled ??
                currentState.resume.settings.isJsonEditorEnabled,
            },
          };

          // 彻底剔除历史遗留的无用字段 sidebarPosition
          delete (mergedResume.layout as unknown as Record<string, unknown>)
            .sidebarPosition;

          return {
            ...currentState,
            resume: mergedResume,
            isBlurMode: mergedResume.settings.isBlurMode,
            isJsonEditorEnabled: mergedResume.settings.isJsonEditorEnabled,
            previewScale: mergedResume.settings.previewScale,
            rightPanelWidth: mergedResume.settings.rightPanelWidth,
            isRightPanelCollapsed: mergedResume.settings.isRightPanelCollapsed,
          };
        },
      },
    ),
    {
      limit: 50,
      partialize: (state) => ({
        resume: state.resume,
      }),
      equality: (pastState, currentState) =>
        JSON.stringify(pastState?.resume) ===
        JSON.stringify(currentState?.resume),
    },
  ),
);
