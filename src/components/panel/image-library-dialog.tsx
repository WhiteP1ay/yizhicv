"use client";

import { Plus, Search, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isImageUploadType, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import { releaseStoredImage } from "@/lib/release-stored-image";
import { useImageTray } from "@/store/image-tray";
import { useResumeStore } from "@/store/resume";

type LibraryImage = {
  id: string;
  name: string;
  publicUrl: string;
  byteSize: number;
};

export const ImageLibraryDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const addToTray = useImageTray((state) => state.add);
  const removeFromTray = useImageTray((state) => state.removeSrc);
  const renameInTray = useImageTray((state) => state.rename);
  const setTrayOpen = useResumeStore((state) => state.setImageTrayOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadGeneration = useRef(0);
  const [query, setQuery] = useState("");
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<LibraryImage | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [pendingDelete, setPendingDelete] = useState<LibraryImage[] | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/uploads?q=${encodeURIComponent(keyword)}`,
      );
      const data: { images?: LibraryImage[]; message?: string } = await response
        .json()
        .catch(() => ({}));
      if (!response.ok) {
        toast.error(data.message ?? "图片库加载失败");
        setImages([]);
        return;
      }
      setImages(data.images ?? []);
    } catch {
      toast.error("图片库加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void load(query);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query, load]);

  const placeInTray = (items: LibraryImage[]) => {
    addToTray(
      items.map((item) => ({
        src: item.publicUrl,
        name: item.name,
        stored: true,
      })),
    );
    setTrayOpen(true);
    setSelected([]);
  };

  const toggleSelected = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const askDelete = (items: LibraryImage[]) => {
    if (items.length === 0) return;
    setPendingDelete(items);
  };

  const deleteImages = async () => {
    const items = pendingDelete;
    if (!items || items.length === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        items.map(async (item) => {
          const removed = await releaseStoredImage(item.publicUrl);
          if (removed) removeFromTray(item.publicUrl);
          return removed;
        }),
      );
      if (results.some((removed) => !removed)) {
        toast.error("有图片没有删掉");
      }
      setSelected([]);
      setPreview(null);
      setPendingDelete(null);
      await load(query);
    } finally {
      setDeleting(false);
    }
  };

  const saveRename = async (image: LibraryImage) => {
    const name = renameValue.trim();
    setRenamingId(null);
    if (!name || name === image.name) return;
    const response = await fetch(`/api/uploads/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data: { name?: string; message?: string } = await response
      .json()
      .catch(() => ({}));
    if (!response.ok || !data.name) {
      toast.error(data.message ?? "改名失败");
      return;
    }
    renameInTray(image.publicUrl, data.name);
    setImages((current) =>
      current.map((item) =>
        item.id === image.id ? { ...item, name: data.name ?? item.name } : item,
      ),
    );
    setPreview((current) =>
      current?.id === image.id
        ? { ...current, name: data.name ?? name }
        : current,
    );
  };

  const uploadFile = async (file: File) => {
    if (!isImageUploadType(file.type)) {
      toast.error("只支持 jpg、png、webp");
      return;
    }
    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      toast.error("单张图片不能超过 5MB");
      return;
    }
    const generation = uploadGeneration.current;
    setUploading(true);
    try {
      const permitResponse = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          size: file.size,
          name: file.name,
        }),
      });
      const permit: {
        message?: string;
        imageId?: string;
        uploadUrl?: string;
        publicUrl?: string;
      } = await permitResponse.json().catch(() => ({}));
      if (
        !permitResponse.ok ||
        !permit.imageId ||
        !permit.uploadUrl ||
        !permit.publicUrl
      ) {
        if (generation === uploadGeneration.current) {
          toast.error(permit.message ?? "上传失败");
        }
        return;
      }
      const uploadResponse = await fetch(permit.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok || generation !== uploadGeneration.current) {
        await releaseStoredImage(permit.publicUrl);
        if (generation === uploadGeneration.current) {
          toast.error("传到对象存储失败");
        }
        return;
      }
      const completeResponse = await fetch(
        `/api/uploads/${permit.imageId}/complete`,
        { method: "POST" },
      );
      if (!completeResponse.ok || generation !== uploadGeneration.current) {
        await releaseStoredImage(permit.publicUrl);
        if (generation === uploadGeneration.current) {
          toast.error("上传没有完成");
        }
        return;
      }
      toast.success("已上传到图片库");
      await load(query);
    } catch {
      toast.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  const selectedImages = images.filter((image) => selected.includes(image.id));

  const confirmSelection = () => {
    if (selectedImages.length === 0) return;
    placeInTray(selectedImages);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) uploadGeneration.current += 1;
          onOpenChange(next);
        }}
      >
        <DialogContent className="flex h-[min(820px,88vh)] w-[min(1080px,calc(100%-2rem))] max-w-none flex-col gap-3 p-5 sm:max-w-none">
          <DialogHeader className="sr-only">
            <DialogTitle>图片库</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void uploadFile(file);
              }}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-3.5" />
              {uploading ? "正在上传" : "添加"}
            </Button>
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <div className="relative w-56">
                <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="按名称搜索"
                  className="w-full rounded-lg border border-slate-200 py-1.5 pr-3 pl-7 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={selectedImages.length === 0}
                onClick={() => askDelete(selectedImages)}
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </div>
          </div>

          {preview ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2">
              <button
                type="button"
                className="self-start text-[11px] text-slate-400 hover:text-slate-600"
                onClick={() => setPreview(null)}
              >
                返回图片库
              </button>
              {/* biome-ignore lint/performance/noImgElement: user-owned remote preview */}
              <img
                src={preview.publicUrl}
                alt={preview.name}
                className="min-h-0 flex-1 rounded-lg object-contain"
              />
              <span className="truncate text-xs text-slate-700">
                {preview.name}
              </span>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              {loading && images.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">
                  正在加载
                </p>
              ) : null}
              {!loading && images.length === 0 ? (
                <p className="py-10 text-center text-xs text-slate-400">
                  {query ? "没有名称匹配的图片" : "还没有上传过图片"}
                </p>
              ) : null}
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((image) => {
                  const checked = selected.includes(image.id);
                  return (
                    <div
                      key={image.id}
                      className={`rounded-lg border p-1.5 ${
                        checked
                          ? "border-blue-500 bg-blue-50/60"
                          : "border-slate-200"
                      }`}
                    >
                      <button
                        type="button"
                        className="block w-full"
                        onClick={() => setPreview(image)}
                      >
                        {/* biome-ignore lint/performance/noImgElement: library thumbnail */}
                        <img
                          src={image.publicUrl}
                          alt={image.name}
                          className="aspect-square w-full rounded object-cover"
                        />
                      </button>
                      {renamingId === image.id ? (
                        <input
                          value={renameValue}
                          autoFocus
                          onChange={(event) =>
                            setRenameValue(event.target.value)
                          }
                          onBlur={() => void saveRename(image)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.currentTarget.blur();
                            }
                          }}
                          className="mt-1 w-full rounded border border-slate-200 px-1 py-0.5 text-[11px]"
                        />
                      ) : (
                        <button
                          type="button"
                          className="mt-1 w-full truncate text-left text-[11px] text-slate-700"
                          title="点击改名"
                          onClick={() => {
                            setRenamingId(image.id);
                            setRenameValue(image.name);
                          }}
                        >
                          {image.name}
                        </button>
                      )}
                      <label className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelected(image.id)}
                        />
                        选择
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={selectedImages.length === 0}
              onClick={confirmSelection}
            >
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
      >
        <DialogContent className="gap-4 p-5 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-slate-800">
              从图片库删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs leading-relaxed text-slate-600">
            {pendingDelete && pendingDelete.length > 1
              ? `从图片库删除这 ${pendingDelete.length} 张图片，存储里的文件也会清掉。`
              : "从图片库删除这张图片，存储里的文件也会清掉。"}
          </p>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={() => void deleteImages()}
            >
              {deleting ? "正在删除" : "删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
