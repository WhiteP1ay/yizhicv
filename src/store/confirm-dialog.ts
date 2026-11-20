"use client";

import { create } from "zustand";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ConfirmState = {
  open: boolean;
  options: ConfirmOptions | null;
  ask: (options: ConfirmOptions) => void;
  finish: (ok: boolean) => void;
};

let pending: ((ok: boolean) => void) | null = null;

export const useConfirmDialog = create<ConfirmState>((set) => ({
  open: false,
  options: null,
  ask: (options) => set({ open: true, options }),
  finish: (ok) => {
    const resolve = pending;
    pending = null;
    set({ open: false });
    resolve?.(ok);
  },
}));

/** 替代 window.confirm。对话框挂在应用根上。 */
export function confirmDialog(options: ConfirmOptions) {
  pending?.(false);
  return new Promise<boolean>((resolve) => {
    pending = resolve;
    useConfirmDialog.getState().ask(options);
  });
}
