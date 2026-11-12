"use client";

import { Image as ImageIcon, Plus, X, ZoomIn } from "lucide-react";
import type React from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useResumeStore } from "@/store/resume";
import type { ImageSlot } from "@/types/resume";

// 最大文件大小限制：5MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
// 允许的 MIME 类型
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
// base64 输出最大边长（像素），超过此尺寸等比缩放
const MAX_OUTPUT_SIZE = 800;

const SLOT_COUNT = 5;

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): PercentCrop {
  return centerCrop(
    makeAspectCrop({ unit: "%" as const, width: 80 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

/** 将 canvas 输出为 base64 Data URL，自动缩放至最大边长 */
function canvasToBase64(canvas: HTMLCanvasElement, mime: string): string {
  const { width, height } = canvas;
  const scale = Math.min(1, MAX_OUTPUT_SIZE / Math.max(width, height));
  if (scale >= 1) return canvas.toDataURL(mime, 0.9);

  const out = document.createElement("canvas");
  out.width = Math.round(width * scale);
  out.height = Math.round(height * scale);
  const ctx = out.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL(mime, 0.9);
}

/** 利用 canvas 裁剪图片，返回 base64 */
async function cropImageToBase64(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  mime: string,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    imgEl,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );
  return canvasToBase64(canvas, mime);
}

// ─── 裁剪弹窗 ─────────────────────────────────────────────────────────────────

interface CropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  srcDataUrl: string;
  mimeType: string;
  fileName: string;
  initialSlot: ImageSlot | null;
  onConfirm: (slot: ImageSlot) => void;
}

const CropDialog: React.FC<CropDialogProps> = ({
  open,
  onOpenChange,
  srcDataUrl,
  mimeType,
  fileName,
  initialSlot,
  onConfirm,
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<PercentCrop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(
    undefined,
  );

  // 重置裁剪区域到居中正方形
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
      const c = centerAspectCrop(width, height, 1);
      setCrop(c);
    },
    [],
  );

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !completedCrop) return;
    const base64 = await cropImageToBase64(imgRef.current, completedCrop, mimeType);
    onConfirm({
      base64,
      cropX: completedCrop.x,
      cropY: completedCrop.y,
      cropWidth: completedCrop.width,
      cropHeight: completedCrop.height,
      fileName,
    });
    onOpenChange(false);
  }, [completedCrop, mimeType, fileName, onConfirm, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-3" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-sm font-medium flex items-center gap-2">
            <ZoomIn className="size-4 text-slate-500" />
            裁剪图片
          </DialogTitle>
        </DialogHeader>

        <p className="text-[11px] text-slate-400">
          拖拽选区调整裁剪范围，图片将以 {MAX_OUTPUT_SIZE}px 边长输出。
        </p>

        <div className="flex justify-center max-h-[60vh] overflow-auto rounded-lg bg-slate-100 p-2">
          <ReactCrop
            crop={crop}
            onChange={(_, p) => setCrop(p)}
            onComplete={(c) => setCompletedCrop(c)}
            circularCrop={false}
            keepSelection
            ruleOfThirds
          >
            {/* biome-ignore lint/a11y/useAltText: crop dialog */}
            <img
              ref={imgRef}
              src={srcDataUrl}
              onLoad={onImageLoad}
              style={{ maxHeight: "55vh", maxWidth: "100%" }}
            />
          </ReactCrop>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={!completedCrop}
          >
            确认裁剪
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ─── 单个图片插槽按钮 ─────────────────────────────────────────────────────────

interface ImageSlotButtonProps {
  index: number;
  slot: ImageSlot | null;
  onUpload: (index: number, file: File) => void;
  onEdit: (index: number) => void;
  onClear: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
}

const ImageSlotButton: React.FC<ImageSlotButtonProps> = ({
  index,
  slot,
  onUpload,
  onEdit,
  onClear,
  onDragStart,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (slot) {
      // 有图片 → 点击打开裁剪编辑弹窗
      onEdit(index);
    } else {
      // 空槽 → 打开文件选择
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    onUpload(index, file);
  };

  return (
    <div className="relative group/imgslot">
      <button
        type="button"
        onClick={handleClick}
        draggable={Boolean(slot)}
        onDragStart={slot ? (e) => onDragStart(e, index) : undefined}
        className={[
          "size-11 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-xs",
          slot
            ? "border-slate-200 hover:border-blue-400 hover:scale-105 hover:shadow-md"
            : "border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/60 hover:text-blue-500 text-slate-400",
        ].join(" ")}
        title={
          slot
            ? `图片槽 ${index + 1}：${slot.fileName}（单击编辑裁剪 / 拖拽到画布）`
            : `图片槽 ${index + 1}：点击上传图片`
        }
      >
        {slot ? (
          <img
            src={slot.base64}
            alt={slot.fileName}
            className="w-full h-full object-cover rounded-full"
            draggable={false}
          />
        ) : (
          <Plus className="size-4 stroke-[2.5] transition-transform group-hover/imgslot:scale-110" />
        )}
      </button>

      {/* 悬停右上角红 × 清除按钮 — 和颜色槽一致 */}
      {slot && (
        <button
          type="button"
          onPointerDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.stopPropagation();
            onClear(index);
          }}
          className="absolute -top-1 -right-1 size-3.5 bg-slate-700 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/imgslot:opacity-100 transition-opacity shadow-xs cursor-pointer z-10"
          title="清空此图片槽"
        >
          <X className="size-2 stroke-[3]" />
        </button>
      )}

      {/* 隐藏 file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
};

// ─── 主面板 ───────────────────────────────────────────────────────────────────

export const ImageSlotsPanel: React.FC = () => {
  const { resume, setImageSlot } = useResumeStore();

  const rawSlots = resume.settings.imageSlots;
  const imageSlots: (ImageSlot | null)[] = [
    rawSlots?.[0] ?? null,
    rawSlots?.[1] ?? null,
    rawSlots?.[2] ?? null,
    rawSlots?.[3] ?? null,
    rawSlots?.[4] ?? null,
  ];

  // 裁剪弹窗状态
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropSrcUrl, setCropSrcUrl] = useState("");
  const [cropMime, setCropMime] = useState("image/jpeg");
  const [cropFileName, setCropFileName] = useState("");
  const [editingIndex, setEditingIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const openCropDialog = useCallback(
    (index: number, dataUrl: string, mime: string, fileName: string) => {
      setEditingIndex(index);
      setCropSrcUrl(dataUrl);
      setCropMime(mime);
      setCropFileName(fileName);
      setCropDialogOpen(true);
    },
    [],
  );

  // 文件上传：验证 → 读取 base64 → 打开裁剪弹窗
  const handleUpload = useCallback(
    (index: number, file: File) => {
      setErrorMsg(null);

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMsg(`不支持的格式：${file.type}，请选择 JPG / PNG / WebP / GIF`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMsg(
          `图片过大（${(file.size / 1024 / 1024).toFixed(1)} MB），限制 5 MB`,
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        openCropDialog(index, dataUrl, file.type, file.name);
      };
      reader.readAsDataURL(file);
    },
    [openCropDialog],
  );

  // 再次编辑已有图片的裁剪（以存储的 base64 重新打开）
  const handleEdit = useCallback(
    (index: number) => {
      const slot = imageSlots[index];
      if (!slot) return;
      openCropDialog(index, slot.base64, cropMime, slot.fileName);
    },
    [imageSlots, openCropDialog, cropMime],
  );

  const handleClear = useCallback(
    (index: number) => {
      setImageSlot(index, null);
    },
    [setImageSlot],
  );

  const handleCropConfirm = useCallback(
    (slot: ImageSlot) => {
      setImageSlot(editingIndex, slot);
    },
    [editingIndex, setImageSlot],
  );

  // 拖拽开始：将 base64 存入 dataTransfer 供画布区接收
  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      const slot = imageSlots[index];
      if (!slot) return;
      e.dataTransfer.effectAllowed = "copy";
      e.dataTransfer.setData("application/yizhicv-image-slot", JSON.stringify(slot));
      e.dataTransfer.setData("text/plain", `[图片: ${slot.fileName}]`);
    },
    [imageSlots],
  );

  // 错误提示自动消失
  useEffect(() => {
    if (!errorMsg) return;
    const timer = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [errorMsg]);

  return (
    <div className="space-y-2">
      {/* 标签行 */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-600 flex items-center gap-1">
          <ImageIcon className="size-3 text-slate-400" />
          <span>图片插槽</span>
        </span>
        <span className="text-[10px] text-slate-400 font-mono">5 个槽位</span>
      </div>

      {/* 5 个圆形槽位 */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
        {Array.from({ length: SLOT_COUNT }, (_, i) => (
          <ImageSlotButton
            key={`img-slot-${i}`}
            index={i}
            slot={imageSlots[i]}
            onUpload={handleUpload}
            onEdit={handleEdit}
            onClear={handleClear}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      {/* 操作提示 */}
      <p className="text-[10px] text-slate-400 leading-relaxed">
        支持 JPG / PNG / WebP / GIF，最大 5MB。点击空槽上传，有图片时点击可重新裁剪，拖拽到画布任意位置插入。
      </p>

      {/* 错误提示 */}
      {errorMsg && (
        <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-md px-2.5 py-1.5">
          {errorMsg}
        </div>
      )}

      {/* 裁剪弹窗 */}
      <CropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        srcDataUrl={cropSrcUrl}
        mimeType={cropMime}
        fileName={cropFileName}
        initialSlot={imageSlots[editingIndex]}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
};
