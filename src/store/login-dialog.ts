"use client";

import { create } from "zustand";

type LoginDialogState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useLoginDialog = create<LoginDialogState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
