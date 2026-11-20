"use client";

import { create } from "zustand";

type SettingsDialogState = {
  open: boolean;
  openDialog: () => void;
  setOpen: (open: boolean) => void;
};

export const useSettingsDialog = create<SettingsDialogState>((set) => ({
  open: false,
  openDialog: () => set({ open: true }),
  setOpen: (open) => set({ open }),
}));
