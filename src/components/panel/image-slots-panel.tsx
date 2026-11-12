"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Crop as CropIcon,
  Globe,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Plus,
  Rows,
  UploadCloud,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useActiveEditorStore } from "@/store/active-editor";
import { useResumeStore } from "@/store/resume";
import type { ImageSlot } from "@/types/resume";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_OUTPUT_SIZE = 800; // base64 输出最大尺寸

const WIDTH_PRESETS = [
  { label: "自适应", value: "" },
  { label: "48px (徽章)", value: "48" },
  { label: "88px (标准头像)", value: "88" },
  { label: "120px (大头像)", value: "120" },
  { label: "100% (通栏)", value: "100%" },
];

const SLOT_KEYS = [
  "image_slot_0",
  "image_slot_1",
  "image_slot_2",
  "image_slot_3",
  "image_slot_4",
] as const;

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
): PercentCrop {
  return centerCrop(
    makeAspectCrop(
      { unit: "%" as const, width: 80 },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

function canvasToBase64(canvas: HTMLCanvasElement, mime: string): string {
  const { width, height } = canvas;
  const scale = Math.min(1, MAX_OUTPUT_SIZE / Math.max(width, height));
  if (scale >= 1) return canvas.toDataURL(mime, 0.92);

  const out = document.createElement("canvas");
  out.width = Math.round(width * scale);
  out.height = Math.round(height * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return canvas.toDataURL(mime, 0.92);

  ctx.drawImage(canvas, 0, 0, out.width, out.height);
  return out.toDataURL(mime, 0.92);
}

async function cropImageToBase64(
  imgEl: HTMLImageElement,
  pixelCrop: PixelCrop,
  mime: string,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

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

export const ImageSlotsPanel: React.FC = () => {
  const { resume, setImageSlot } = useResumeStore();
  const { getEffectiveEditor } = useActiveEditorStore();

  const rawSlots = resume.settings.imageSlots;
  const imageSlots: (ImageSlot | null)[] = [
    rawSlots?.[0] ?? null,
    rawSlots?.[1] ?? null,
    rawSlots?.[2] ?? null,
    rawSlots?.[3] ?? null,
    rawSlots?.[4] ?? null,
  ];

  // 弹窗状态
  const [modalOpen, setModalOpen] = useState(false);
  const [sourceType, setSourceType] = useState<"upload" | "url">("upload");

  // 图片数据与排版配置
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageFileName, setImageFileName] = useState<string>("");
  const [urlInput, setUrlInput] = useState<string>("");
  const [displayMode, setDisplayMode] = useState<"block" | "inline">("block");
  const [selectedWidth, setSelectedWidth] = useState<string>("88");
  const [alignment, setAlignment] = useState<"left" | "center" | "right">(
    "center",
  );
  const [saveToSlot, setSaveToSlot] = useState<boolean>(true);
  const [targetSlotIdx, setTargetSlotIdx] = useState<number>(0);

  // 裁剪模式状态
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<PercentCrop | undefined>(undefined);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | undefined>(
    undefined,
  );
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 打开弹窗：针对点击某个插槽
  const handleSlotClick = (index: number) => {
    setTargetSlotIdx(index);
    const existing = imageSlots[index];
    if (existing) {
      setImageSrc(existing.base64);
      setImageFileName(existing.fileName);
      setSourceType("upload");
    } else {
      setImageSrc("");
      setImageFileName("");
      setSourceType("upload");
      setTimeout(() => fileInputRef.current?.click(), 50);
    }
    setModalOpen(true);
  };

  // 打开弹窗：点击主“插入图片”按钮
  const handleOpenGeneralModal = () => {
    setImageSrc("");
    setImageFileName("");
    setUrlInput("");
    setSourceType("upload");
    setModalOpen(true);
  };

  // 清空插槽
  const handleClearSlot = (index: number) => {
    setImageSlot(index, null);
    toast.success(`已清空图片槽 ${index + 1}`);
  };

  // 校验并处理本地文件
  const handleFileSelected = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error(
        `不支持该图片格式（${file.type || "未知"}），仅支持 JPG、PNG、WebP、GIF、SVG`,
      );
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `图片大小超过限制（${(file.size / 1024 / 1024).toFixed(1)}MB），最大支持 5MB`,
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageSrc(result);
      setImageFileName(file.name);
      setIsCropping(false);
    };
    reader.readAsDataURL(file);
  };

  // 裁剪确认
  const handleApplyCrop = async () => {
    if (!imgRef.current || !completedCrop) return;
    try {
      const croppedBase64 = await cropImageToBase64(
        imgRef.current,
        completedCrop,
        "image/png",
      );
      setImageSrc(croppedBase64);
      setIsCropping(false);
      toast.success("已完成图片裁剪");
    } catch {
      toast.error("图片裁剪失败，请重试");
    }
  };

  // 确认插入到 Tiptap 编辑器
  const handleConfirmInsert = () => {
    const finalSrc = sourceType === "url" ? urlInput.trim() : imageSrc;
    if (!finalSrc) {
      toast.error("请先选择本地图片或输入图片链接");
      return;
    }

    const editor = getEffectiveEditor();
    if (!editor) {
      toast.error("未找到可编辑模块，请先在画布中点击选中一个内容模块");
      return;
    }

    const widthVal = selectedWidth
      ? selectedWidth.endsWith("%")
        ? selectedWidth
        : Number.parseInt(selectedWidth, 10)
      : null;

    if (displayMode === "inline") {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "inlineImage",
          attrs: {
            src: finalSrc,
            alt: imageFileName || "inline-image",
            width: widthVal,
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
            src: finalSrc,
            alt: imageFileName || "block-image",
            width: widthVal,
            alignment,
          },
        })
        .run();
    }

    // 若勾选了保存到插槽，则同步写入
    if (
      saveToSlot &&
      typeof targetSlotIdx === "number" &&
      targetSlotIdx >= 0 &&
      targetSlotIdx < 5
    ) {
      setImageSlot(targetSlotIdx, {
        base64: finalSrc,
        cropX: 0,
        cropY: 0,
        cropWidth: 100,
        cropHeight: 100,
        fileName: imageFileName || "image",
      });
    }

    toast.success(
      `已插入${displayMode === "inline" ? "行内" : "块级"}图片至当前模块`,
    );
    setModalOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* 顶部标签行与快速插入按钮 */}
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-700 flex items-center gap-1.5">
          <ImageIcon className="size-3.5 text-blue-600" />
          <span>图片插入与插槽</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleOpenGeneralModal}
          className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 gap-1 rounded cursor-pointer"
        >
          <Plus className="size-2.5" />
          <span>插入图片...</span>
        </Button>
      </div>

      {/* 5 个圆形图片插槽 */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>图片槽位（点击编辑 / 可直接拖拽）</span>
          <span className="font-mono">5 个色槽</span>
        </div>

        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
          {SLOT_KEYS.map((slotKey, i) => {
            const slot = imageSlots[i];
            return (
              <div key={slotKey} className="relative group/imgslot">
                <button
                  type="button"
                  onClick={() => handleSlotClick(i)}
                  draggable={Boolean(slot)}
                  onDragStart={(e) => {
                    if (!slot) return;
                    e.dataTransfer.effectAllowed = "copy";
                    e.dataTransfer.setData(
                      "application/yizhicv-image-slot",
                      JSON.stringify(slot),
                    );
                    e.dataTransfer.setData("text/plain", slot.base64);
                  }}
                  className={`size-11 rounded-full border-2 transition-all flex items-center justify-center overflow-hidden cursor-pointer shadow-2xs ${
                    slot
                      ? "border-slate-200 hover:border-blue-500 hover:scale-105 hover:ring-2 hover:ring-blue-400/40"
                      : "border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-400"
                  }`}
                  title={
                    slot
                      ? `图片槽 ${i + 1}：${slot.fileName || "已保存图片"} (点击弹窗编辑 / 按住可拖入文档)`
                      : `图片槽 ${i + 1}：点击上传新图片`
                  }
                >
                  {slot ? (
                    /* biome-ignore lint/performance/noImgElement: user-generated base64 preview */
                    <img
                      src={slot.base64}
                      alt={slot.fileName}
                      className="w-full h-full object-cover pointer-events-none select-none rounded-full"
                    />
                  ) : (
                    <Plus className="size-4 stroke-[2.5] transition-transform group-hover/imgslot:scale-110" />
                  )}
                </button>

                {/* 悬停右上角红 x 清空按钮 (与自定义颜色槽样式完全一致) */}
                {slot && (
                  <button
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSlot(i);
                    }}
                    className="absolute -top-1 -right-1 size-3.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover/imgslot:opacity-100 transition-opacity shadow-xs cursor-pointer z-10"
                    title="清空此图片槽"
                  >
                    <X className="size-2 stroke-[3]" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 隐藏的文件输入组件 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelected(file);
            e.target.value = "";
          }
        }}
      />

      {/* 提示文案 */}
      <p className="text-[10px] text-slate-400 leading-normal">
        💡 基于 Tiptap
        原生图片引擎，支持本地上传或网络链接，自由选择行内或块级排版，安全可靠不破坏版面。
      </p>

      {/* 图片插入主弹窗 */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md gap-4 p-5">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
              <ImageIcon className="size-4 text-blue-600" />
              插入图片至简历模块
            </DialogTitle>
          </DialogHeader>

          {/* 选项卡：本地上传 vs 网络外链 */}
          <div className="flex border-b border-slate-200 gap-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setSourceType("upload")}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                sourceType === "upload"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <UploadCloud className="size-3.5" />
              <span>本地图片上传</span>
            </button>
            <button
              type="button"
              onClick={() => setSourceType("url")}
              className={`pb-2 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                sourceType === "url"
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Globe className="size-3.5" />
              <span>填入网络链接</span>
            </button>
          </div>

          {/* Tab 1: 本地上传 */}
          {sourceType === "upload" && (
            <div className="space-y-3">
              {!imageSrc ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 group block"
                >
                  <div className="size-10 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UploadCloud className="size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                      点击上传本地图片
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      支持 JPG、PNG、WebP、GIF、SVG，最大不超过 5MB
                    </p>
                  </div>
                </button>
              ) : isCropping ? (
                <div className="space-y-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                    <span>裁剪图片选区</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      onClick={() => setIsCropping(false)}
                      className="h-5 text-slate-400 hover:text-slate-600"
                    >
                      取消裁剪
                    </Button>
                  </div>
                  <div className="flex justify-center max-h-56 overflow-auto rounded bg-slate-900/5 p-1">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, p) => setCrop(p)}
                      onComplete={(c) => setCompletedCrop(c)}
                      keepSelection
                      ruleOfThirds
                    >
                      {/* biome-ignore lint/performance/noImgElement: dynamic cropper view */}
                      <img
                        ref={imgRef}
                        src={imageSrc}
                        alt="Crop target"
                        onLoad={(e) => {
                          const { naturalWidth: w, naturalHeight: h } =
                            e.currentTarget;
                          setCrop(centerAspectCrop(w, h, 1));
                        }}
                        style={{ maxHeight: "200px", maxWidth: "100%" }}
                      />
                    </ReactCrop>
                  </div>
                  <Button
                    type="button"
                    size="xs"
                    onClick={handleApplyCrop}
                    className="w-full text-xs"
                  >
                    确认裁剪
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="size-14 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                    {/* biome-ignore lint/performance/noImgElement: local image preview */}
                    <img
                      src={imageSrc}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {imageFileName || "已加载图片"}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      已就绪并转换为 Base64
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-5 px-1.5 text-[10px]"
                      >
                        更换图片
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setIsCropping(true)}
                        className="h-5 px-1.5 text-[10px] gap-1"
                      >
                        <CropIcon className="size-2.5" />
                        <span>裁剪大小</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 网络外链 */}
          {sourceType === "url" && (
            <div className="space-y-2">
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
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/photo.png"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {urlInput && (
                <div className="size-16 rounded-lg overflow-hidden border border-slate-200 mx-auto mt-2 bg-slate-50 flex items-center justify-center">
                  {/* biome-ignore lint/performance/noImgElement: remote url preview */}
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() =>
                      toast.error("图片链接无法加载，请检查地址有效性")
                    }
                  />
                </div>
              )}
            </div>
          )}

          {/* 排版形式选择：行内 vs 块级 */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Layers className="size-3 text-slate-400" />
              <span>排版形式 (Tiptap 模式)</span>
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
                  <span>块级图片 (Block)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  独占一行独立排版，适合个人照片、证件照、证书、作品图
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
                  <span>行内图片 (Inline)</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  嵌入文字行内混排，适合图标、技能徽章、签名
                </p>
              </button>
            </div>
          </div>

          {/* 尺寸预设与对齐方式 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-700">
              <span>图片显示宽度</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {selectedWidth
                  ? `${selectedWidth}${selectedWidth.endsWith("%") ? "" : "px"}`
                  : "默认"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {WIDTH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setSelectedWidth(p.value)}
                  className={`px-2 py-1 text-[10px] rounded-md border transition-all cursor-pointer ${
                    selectedWidth === p.value
                      ? "bg-slate-900 text-white border-slate-900 font-medium"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* 块级图片的对齐控制 */}
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

          {/* 保存到插槽选项 */}
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveToSlot}
                onChange={(e) => setSaveToSlot(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-[11px]">同步保存到图片插槽</span>
            </label>
            {saveToSlot && (
              <select
                value={targetSlotIdx}
                onChange={(e) => setTargetSlotIdx(Number(e.target.value))}
                className="text-xs bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
              >
                {SLOT_KEYS.map((slotKey, i) => (
                  <option key={slotKey} value={i}>
                    槽位 {i + 1} {imageSlots[i] ? "(覆盖)" : "(空)"}
                  </option>
                ))}
              </select>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmInsert}
              disabled={sourceType === "url" ? !urlInput.trim() : !imageSrc}
            >
              确认插入到当前模块
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
