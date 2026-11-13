"use client";

import { Globe, Image as ImageIcon, Images } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { fileNameFromImageUrl, isRemoteImageUrl } from "@/lib/image-url";
import { useImageTray } from "@/store/image-tray";
import { useLoginDialog } from "@/store/login-dialog";
import { useResumeStore } from "@/store/resume";
import { ConfigCard } from "./config-card";
import { ImageLibraryDialog } from "./image-library-dialog";

export const ImageInsertPanel: React.FC = () => {
  const { status: authStatus, user } = useCurrentUser();
  const setLoginOpen = useLoginDialog((state) => state.setOpen);
  const addToTray = useImageTray((state) => state.add);
  const setTrayOpen = useResumeStore((state) => state.setImageTrayOpen);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");

  const openLibrary = () => {
    if (user) {
      setLibraryOpen(true);
      return;
    }
    if (authStatus === "loading") return;
    setLoginOpen(true);
  };

  const confirmLink = () => {
    const src = link.trim();
    if (!isRemoteImageUrl(src)) {
      toast.error("请输入 http 或 https 图片地址");
      return;
    }
    addToTray([
      {
        src,
        name: fileNameFromImageUrl(src),
        stored: false,
      },
    ]);
    setTrayOpen(true);
    setLink("");
    setLinkOpen(false);
  };

  return (
    <>
      <ConfigCard
        id="image"
        title="图片"
        icon={<ImageIcon className="size-3.5 text-blue-600" />}
        className="space-y-2.5"
      >
        <p className="text-[11px] leading-relaxed text-slate-500">
          先放进备选，再拖进文档。
        </p>
        <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setLinkOpen(true)}
            className="flex h-8 cursor-pointer items-center justify-center gap-1.5 border-r border-slate-200 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Globe className="size-3.5 text-slate-500" />
            网络图片
          </button>
          <button
            type="button"
            onClick={openLibrary}
            className="flex h-8 cursor-pointer items-center justify-center gap-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <Images className="size-3.5 text-slate-500" />
            图片库
          </button>
        </div>
      </ConfigCard>

      <Dialog
        open={linkOpen}
        onOpenChange={(open) => {
          setLinkOpen(open);
          if (!open) setLink("");
        }}
      >
        <DialogContent className="gap-4 p-5 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-slate-800">
              网络图片
            </DialogTitle>
          </DialogHeader>
          <input
            value={link}
            onChange={(event) => setLink(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") confirmLink();
            }}
            placeholder="https://example.com/photo.png"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
          <Button type="button" onClick={confirmLink}>
            确认
          </Button>
        </DialogContent>
      </Dialog>

      <ImageLibraryDialog open={libraryOpen} onOpenChange={setLibraryOpen} />
    </>
  );
};
