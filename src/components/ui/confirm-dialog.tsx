"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useConfirmDialog } from "@/store/confirm-dialog";

export function ConfirmDialog() {
  const open = useConfirmDialog((state) => state.open);
  const options = useConfirmDialog((state) => state.options);
  const finish = useConfirmDialog((state) => state.finish);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) finish(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description ? (
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">
            {options?.cancelLabel ?? "取消"}
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant={options?.destructive ? "destructive" : "default"}
            onClick={() => finish(true)}
          >
            {options?.confirmLabel ?? "确定"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
