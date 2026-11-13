import { create } from "zustand";

export type TrayImage = {
  src: string;
  name: string;
  stored: boolean;
};

type ImageTrayState = {
  items: TrayImage[];
  add: (images: TrayImage[]) => void;
  removeSrc: (src: string) => void;
  rename: (src: string, name: string) => void;
};

export const useImageTray = create<ImageTrayState>((set) => ({
  items: [],
  add: (images) =>
    set((state) => {
      const seen = new Set(state.items.map((item) => item.src));
      const next = [...state.items];
      for (const image of images) {
        if (!image.src || seen.has(image.src)) continue;
        seen.add(image.src);
        next.push(image);
      }
      return { items: next };
    }),
  removeSrc: (src) =>
    set((state) => ({
      items: state.items.filter((item) => item.src !== src),
    })),
  rename: (src, name) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.src === src ? { ...item, name } : item,
      ),
    })),
}));
