"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Globe,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Plus,
  Rows,
  UploadCloud,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isImageUploadType, MAX_IMAGE_UPLOAD_BYTES } from "@/lib/image-upload";
import { fileNameFromImageUrl, isRemoteImageUrl } from "@/lib/image-url";
import { releaseStoredImage } from "@/lib/release-stored-image";
import { useActiveEditorStore } from "@/store/active-editor";
import { useLoginDialog } from "@/store/login-dialog";
import { ConfigCard } from "./config-card";

type ImageSource = "choose" | "url" | "upload";

export const ImageInsertPanel: React.FC = () => {
  const { getEffectiveEditor } = useActiveEditorStore();
  const { status: authStatus, user } = useCurrentUser();
  const setLoginOpen = useLoginDialog((state) => state.setOpen);

  const [modalOpen, setModalOpen] = useState(false);
  const [source, setSource] = useState<ImageSource>("choose");
  const [urlInput, setUrlInput] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [displayMode, setDisplayMode] = useState<"block" | "inline">("block");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(
    "center",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadGeneration = useRef(0);
  const ownedUrlRef = useRef<string | null>(null);
  const insertedOwnedRef = useRef(false);
  const [uploading, setUploading] = useState(false);

  const resetForm = () => {
    const src = ownedUrlRef.current;
    const keep = insertedOwnedRef.current;
    uploadGeneration.current += 1;
    ownedUrlRef.current = null;
    insertedOwnedRef.current = false;
    setSource("choose");
    setUrlInput("");
    setPreviewFailed(false);
    setDisplayMode("block");
    setAlignment("center");
    setUploading(false);
    if (src && !keep) void releaseStoredImage(src);
  };

  const handleConfirmInsert = () => {
    const src = urlInput.trim();
    if (!isRemoteImageUrl(src)) {
      toast.error("请输入 http 或 https 图片地址");
      return;
    }

    const editor = getEffectiveEditor();
    if (!editor) {
      toast.error("未找到可编辑模块，请先在画布中点击选中一个内容模块");
      return;
    }

    const fileName = fileNameFromImageUrl(src);
    const stored = ownedUrlRef.current === src;
    if (stored) insertedOwnedRef.current = true;
    if (displayMode === "inline") {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "inlineImage",
          attrs: {
            src,
            alt: fileName,
            stored,
          },
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "image",
          attrs: {
            src,
            alt: fileName,
            alignment,
            stored,
          },
        })
        .run();
    }

    toast.success(
      `已插入${displayMode === "inline" ? "行内" : "块级"}图片至当前模块`,
    );
    setModalOpen(false);
  };

  const handleLocalFile = async (file: File) => {
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
        body: JSON.stringify({ contentType: file.type, size: file.size }),
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
      const completed: { message?: string; publicUrl?: string } =
        await completeResponse.json().catch(() => ({}));
      if (
        !completeResponse.ok ||
        !completed.publicUrl ||
        generation !== uploadGeneration.current
      ) {
        await releaseStoredImage(permit.publicUrl);
        if (generation === uploadGeneration.current) {
          toast.error(completed.message ?? "上传没有完成");
        }
        return;
      }

      const previous = ownedUrlRef.current;
      if (
        previous &&
        previous !== completed.publicUrl &&
        !insertedOwnedRef.current
      ) {
        void releaseStoredImage(previous);
      }
      ownedUrlRef.current = completed.publicUrl;
      insertedOwnedRef.current = false;
      setUrlInput(completed.publicUrl);
      setPreviewFailed(false);
      setSource("url");
      toast.success("已上传，确认后插入到当前模块");
    } catch {
      toast.error("上传失败");
    } finally {
      if (generation === uploadGeneration.current) setUploading(false);
    }
  };

  const urlReady = isRemoteImageUrl(urlInput.trim());

  return (
    <>
      <ConfigCard
        id="image"
        title="图片"
        icon={<ImageIcon className="size-3.5 text-blue-600" />}
        extra={
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 gap-1 rounded cursor-pointer"
          >
            <Plus className="size-2.5" />
            <span>插入图片...</span>
          </Button>
        }
        className="space-y-3"
      >
        <p className="text-[10px] text-slate-400 leading-normal">
          外链直接写进正文。本地图片会上传到对象存储，文档里只保存地址。
        </p>
      </ConfigCard>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md gap-4 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
              <ImageIcon className="size-4 text-blue-600" />
              插入图片至简历模块
            </DialogTitle>
          </DialogHeader>

          {source === "choose" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSource("url")}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left cursor-pointer transition-all"
              >
                <Globe className="size-4 text-blue-600" />
                <span className="mt-2 block text-xs font-medium text-slate-800">
                  图片链接
                </span>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  使用网上的图片，文档里只保存地址
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (user) {
                    setSource("upload");
                    return;
                  }
                  if (authStatus === "loading") return;
                  setModalOpen(false);
                  setLoginOpen(true);
                }}
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left cursor-pointer transition-all"
              >
                <UploadCloud className="size-4 text-blue-600" />
                <span className="mt-2 block text-xs font-medium text-slate-800">
                  本地上传
                </span>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  需要登录。上传后文档里只保存地址
                </p>
              </button>
            </div>
          )}

          {source === "upload" && (
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void handleLocalFile(file);
                }}
              />
              <p className="text-xs leading-relaxed text-slate-700">
                图片传到对象存储，文档里只保存地址。
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "正在上传" : "选择图片"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSource("choose")}
                >
                  返回
                </Button>
              </div>
            </div>
          )}

          {source === "url" && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSource("choose")}
                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                返回选择来源
              </button>
              <label
                htmlFor="image-url-input"
                className="text-xs font-medium text-slate-700 block"
              >
                图片网络 URL
              </label>
              <input
                id="image-url-input"
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setPreviewFailed(false);
                }}
                placeholder="https://example.com/photo.png"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {urlReady && !previewFailed && (
                <div className="size-16 rounded-lg overflow-hidden border border-slate-200 mx-auto bg-slate-50 flex items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: remote url preview */}
                  <img
                    src={urlInput.trim()}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewFailed(true)}
                  />
                </div>
              )}
              {urlReady && previewFailed && (
                <p className="text-[10px] text-center text-slate-400">
                  这个地址暂时预览不出来，仍可以插入。
                </p>
              )}

              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Layers className="size-3 text-slate-400" />
                  <span>排版形式</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayMode("block")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      displayMode === "block"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <Rows className="size-3.5 text-blue-600" />
                      <span>块级图片</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      独占一行，适合照片、证件照、作品图
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode("inline")}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      displayMode === "inline"
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-500/30"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-medium text-xs">
                      <Maximize2 className="size-3.5 text-blue-600" />
                      <span>行内图片</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                      嵌在文字行里，适合图标、徽章
                    </p>
                  </button>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-400">
                插入后点选图片，拖右下角改宽度。高度按比例跟着变。
              </p>

              {displayMode === "block" && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">水平对齐</span>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
                    <button
                      type="button"
                      onClick={() => setAlignment("left")}
                      className={`size-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        alignment === "left"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="居左对齐"
                    >
                      <AlignLeft className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlignment("center")}
                      className={`size-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        alignment === "center"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="居中对齐"
                    >
                      <AlignCenter className="size-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlignment("right")}
                      className={`size-6 rounded flex items-center justify-center transition-colors cursor-pointer ${
                        alignment === "right"
                          ? "bg-white text-blue-600 shadow-2xs"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title="居右对齐"
                    >
                      <AlignRight className="size-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              取消
            </Button>
            {source === "url" && (
              <Button
                type="button"
                size="sm"
                onClick={handleConfirmInsert}
                disabled={!urlReady}
              >
                确认插入到当前模块
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
