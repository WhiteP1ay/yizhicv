"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idbStorage } from "@/lib/idb-storage";
import type { ImageSlot } from "@/types/resume";

export interface CanvasImageItem {
  id: string;
  slot: ImageSlot;
  /** 相对于 A4 纸张左上角的位置（px，794×1123 坐标系） */
  x: number;
  y: number;
  /** 显示尺寸（px，默认 100） */
  width: number;
  height: number;
}

interface CanvasImagesState {
  items: CanvasImageItem[];
  addItem: (item: CanvasImageItem) => void;
  updateItem: (id: string, patch: Partial<Omit<CanvasImageItem, "id">>) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
}

export const useCanvasImagesStore = create<CanvasImagesState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

      updateItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((it) =>
            it.id === id ? { ...it, ...patch } : it,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((it) => it.id !== id),
        })),

      clearAll: () => set({ items: [] }),
    }),
    {
      name: "yizhicv_canvas_images",
      storage: createJSONStorage(() => idbStorage),
    },
  ),
);
